import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDTO } from './dto/create-message.dto';
import { MessageDTO } from './dto/message.dto';
import { ConversationDTO } from './dto/conversation.dto';
import { plainToInstance } from 'class-transformer';
import { ChatStatus } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find or create a new conversation.
   * - If the sender is a customer → create a new ticket (staff = null)
   * - If the sender is a staff → must provide customerId to find/create properly
   */
  private async findOrCreateConversation(senderId: string, receiverId?: string): Promise<string> {
    const sender = await this.prisma.account.findUnique({
      where: { id: senderId },
      select: { role: true },
    });

    if (!sender) throw new NotFoundException('Sender not found');

    let customerId: string;
    let staffId: string | null = null;

    if (sender.role === 'CUSTOMER') {
      customerId = senderId;
      staffId = null;
    } else {
      if (!receiverId) throw new BadRequestException('Staff must provide a customerId');
      customerId = receiverId;
      staffId = senderId;
    }

    // Check if this customer already has an open ticket
    const existing = await this.prisma.conversation.findFirst({
      where: {
        customerId,
        status: ChatStatus.OPEN,
      },
    });

    if (existing) return existing.id;

    // Otherwise, create a new one
    const created = await this.prisma.conversation.create({
      data: {
        customerId,
        staffId,
        status: ChatStatus.OPEN,
      },
    });

    return created.id;
  }

  /**
   * Send a message
   * - Customer: automatically creates a ticket if none exists
   * - Staff: can only send if already assigned
   */
  async createMessage(senderId: string, dto: CreateMessageDTO): Promise<MessageDTO> {
    let conversationId = dto.conversationId;
    // If no conversation exists → create a new one (for customer)
    if (!conversationId) {
      conversationId = await this.findOrCreateConversation(senderId, dto.receiverId);
    }

    // Validate conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.status !== ChatStatus.OPEN)
      throw new ForbiddenException('Conversation not found or already closed');

    // Validate sender permissions
    const sender = await this.prisma.account.findUnique({
      where: { id: senderId },
      select: { role: true },
    });

    if (sender?.role !== 'CUSTOMER' && conversation.staffId !== senderId)
      throw new ForbiddenException('You are not allowed to send in this ticket');

    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId: dto.receiverId || conversation.staffId || null,
        content: dto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            customer: { select: { firstName: true, lastName: true } },
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            customer: { select: { firstName: true, lastName: true } },
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Update latest activity timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return plainToInstance(MessageDTO, message, { excludeExtraneousValues: true });
  }

  /**
   * Get all messages in a conversation
   */
  async getMessagesByConversation(conversationId: string, userId: string): Promise<MessageDTO[]> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { customerId: true, staffId: true },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.customerId !== userId && conversation.staffId !== userId)
      throw new ForbiddenException('You are not allowed to view this conversation');

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            customer: { select: { firstName: true, lastName: true } },
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            customer: { select: { firstName: true, lastName: true } },
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { sentAt: 'asc' },
    });

    return plainToInstance(MessageDTO, messages, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get conversations for a specific user
   * - Customer: sees all their tickets
   * - Staff: sees assigned + unclaimed open tickets
   */
  async getUserConversations(userId: string): Promise<ConversationDTO[]> {
    const user = await this.prisma.account.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const whereClause =
      user.role === 'CUSTOMER'
        ? { customerId: userId }
        : {
            OR: [{ staffId: userId }, { staffId: null, status: ChatStatus.OPEN }],
          };

    const conversations = await this.prisma.conversation.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            customer: { select: { firstName: true, lastName: true } },
          },
        },
        staff: {
          select: {
            id: true,
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                customer: { select: { firstName: true, lastName: true } },
                employee: { select: { firstName: true, lastName: true } },
              },
            },
            receiver: {
              select: {
                id: true,
                email: true,
                customer: { select: { firstName: true, lastName: true } },
                employee: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return plainToInstance(ConversationDTO, conversations, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Staff claims an open ticket
   */
  async assignStaffToConversation(
    conversationId: string,
    staffId: string
  ): Promise<ConversationDTO> {
    const staff = await this.prisma.account.findUnique({
      where: { id: staffId },
      select: { role: true },
    });

    if (!staff || staff.role === 'CUSTOMER') throw new ForbiddenException('Invalid staff account');

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.status !== ChatStatus.OPEN)
      throw new ForbiddenException('Conversation is not open');

    if (conversation.staffId && conversation.staffId !== staffId)
      throw new ForbiddenException('This ticket has already been claimed');

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { staffId },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            customer: { select: { firstName: true, lastName: true } },
          },
        },
        staff: {
          select: {
            id: true,
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
    });

    return plainToInstance(ConversationDTO, updated, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Staff closes a ticket
   */
  async closeConversation(conversationId: string, staffId: string): Promise<ConversationDTO> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { staffId: true, status: true },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.staffId !== staffId)
      throw new ForbiddenException('Only the assigned staff can close this ticket');

    if (conversation.status !== ChatStatus.OPEN)
      throw new ForbiddenException('Conversation is already closed');

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ChatStatus.CLOSED },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            customer: { select: { firstName: true, lastName: true } },
          },
        },
        staff: {
          select: {
            id: true,
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return plainToInstance(ConversationDTO, updated, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get a conversation by its ID
   */
  async getConversationById(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async createConversationForCustomer(customerId: string) {
    const conversation = await this.prisma.conversation.create({
      data: {
        customerId,
        status: ChatStatus.OPEN,
      },
    });
    return conversation;
  }
}
