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

  private async findOrCreateConversation(senderId: string, receiverId?: string): Promise<string> {
    // Get sender role
    const sender = await this.prisma.account.findUnique({
      where: { id: senderId },
      select: { role: true },
    });

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    let customerId: string;
    let staffId: string | null = null;
    if (sender.role === 'CUSTOMER') {
      customerId = senderId;
      staffId = null;
    } else {
      if (!receiverId) throw new BadRequestException('Staff must provide customerId');
      customerId = receiverId;
      staffId = senderId;
    }

    // Look for existing OPEN conversation for this customer
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        customerId,
        status: ChatStatus.OPEN,
      },
    });

    if (existingConversation) {
      return existingConversation.id;
    }

    // Create new conversation (ticket) for customer
    const newConversation = await this.prisma.conversation.create({
      data: {
        customerId,
        staffId, // null initially
        status: ChatStatus.OPEN,
      },
    });

    return newConversation.id;
  }

  async createMessage(senderId: string, createMessageDto: CreateMessageDTO): Promise<MessageDTO> {
    let conversationId = createMessageDto.conversationId;

    // If no conversationId provided, find or create a conversation (only for customers)
    if (!conversationId) {
      conversationId = await this.findOrCreateConversation(senderId, createMessageDto.receiverId);
    }

    // Validate conversation exists and is open
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.status !== ChatStatus.OPEN) {
      throw new ForbiddenException('Conversation is closed or does not exist');
    }

    // For staff replies, ensure they are assigned to the conversation
    const sender = await this.prisma.account.findUnique({
      where: { id: senderId },
      select: { role: true },
    });

    if (sender?.role !== 'CUSTOMER' && conversation.staffId !== senderId) {
      throw new ForbiddenException('Staff not assigned to this conversation');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId: createMessageDto.receiverId || conversation.staffId || null, // Use assigned staff or null
        content: createMessageDto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return plainToInstance(MessageDTO, message, { excludeExtraneousValues: true });
  }

  async getMessagesByConversation(conversationId: string, userId: string): Promise<MessageDTO[]> {
    // Validate user has access to this conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { customerId: true, staffId: true },
    });

    if (!conversation || (conversation.customerId !== userId && conversation.staffId !== userId)) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        sentAt: 'asc',
      },
    });

    return plainToInstance(MessageDTO, messages, { excludeExtraneousValues: true });
  }

  async getUserConversations(userId: string): Promise<ConversationDTO[]> {
    const user = await this.prisma.account.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let conversations;

    if (user.role === 'CUSTOMER') {
      // Customers see all their conversations
      conversations = await this.prisma.conversation.findMany({
        where: { customerId: userId },
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
            take: 1, // Only get the last message
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else {
      // Staff see assigned conversations OR open tickets available for claiming
      conversations = await this.prisma.conversation.findMany({
        where: {
          OR: [
            { staffId: userId }, // Assigned to this staff
            { staffId: null, status: ChatStatus.OPEN }, // Available to claim
          ],
        },
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
            take: 1, // Only get the last message
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    return plainToInstance(ConversationDTO, conversations, {
      excludeExtraneousValues: true,
    });
  }

  async assignStaffToConversation(
    conversationId: string,
    staffId: string
  ): Promise<ConversationDTO> {
    // Validate staff exists and is staff role
    const staff = await this.prisma.account.findUnique({
      where: { id: staffId },
      select: { role: true },
    });

    if (!staff || staff.role === 'CUSTOMER') {
      throw new ForbiddenException('Invalid staff member');
    }

    // Check if conversation exists and is available to claim
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.status !== ChatStatus.OPEN) {
      throw new ForbiddenException('Conversation is not open');
    }

    if (conversation.staffId && conversation.staffId !== staffId) {
      throw new ForbiddenException('Conversation already assigned to another staff member');
    }

    const updatedConversation = await this.prisma.conversation.update({
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
    });

    return plainToInstance(ConversationDTO, updatedConversation, {
      excludeExtraneousValues: true,
    });
  }

  async closeConversation(conversationId: string, staffId: string): Promise<ConversationDTO> {
    // Validate staff is assigned to this conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { staffId: true, status: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.staffId !== staffId) {
      throw new ForbiddenException('Only assigned staff can close this conversation');
    }

    if (conversation.status !== ChatStatus.OPEN) {
      throw new ForbiddenException('Conversation is already closed');
    }

    const updatedConversation = await this.prisma.conversation.update({
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
    });

    return plainToInstance(ConversationDTO, updatedConversation, {
      excludeExtraneousValues: true,
    });
  }

  async getConversationById(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }
}
