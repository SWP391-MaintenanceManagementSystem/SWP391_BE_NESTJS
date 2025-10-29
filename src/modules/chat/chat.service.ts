import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDTO } from './dto/create-message.dto';
import { MessageDTO } from './dto/message.dto';
import { ConversationDTO } from './dto/conversation.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private async findOrCreateConversation(senderId: string, receiverId: string): Promise<string> {
    const [sender, receiver] = await Promise.all([
      this.prisma.account.findUnique({
        where: { id: senderId },
        select: { role: true },
      }),
      this.prisma.account.findUnique({
        where: { id: receiverId },
        select: { role: true },
      }),
    ]);

    if (!sender || !receiver) {
      throw new Error('Sender or receiver not found');
    }

    let customerId: string;
    let staffId: string | undefined;

    // Determine customer and staff based on roles
    if (sender.role === 'CUSTOMER' && receiver.role !== 'CUSTOMER') {
      customerId = senderId;
      staffId = receiverId;
    } else if (receiver.role === 'CUSTOMER' && sender.role !== 'CUSTOMER') {
      customerId = receiverId;
      staffId = senderId;
    } else if (sender.role === 'CUSTOMER') {
      customerId = senderId;
    } else if (receiver.role === 'CUSTOMER') {
      customerId = receiverId;
    } else {
      throw new Error('Invalid conversation participants');
    }

    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        customerId,
        staffId,
        status: 'OPEN',
      },
    });

    if (existingConversation) {
      return existingConversation.id;
    }

    const newConversation = await this.prisma.conversation.create({
      data: {
        customerId,
        staffId,
        status: 'OPEN',
      },
    });

    return newConversation.id;
  }

  async createMessage(senderId: string, createMessageDto: CreateMessageDTO): Promise<MessageDTO> {
    let conversationId = createMessageDto.conversationId;

    // If no conversationId provided, find or create a conversation
    if (!conversationId) {
      conversationId = await this.findOrCreateConversation(senderId, createMessageDto.receiverId);
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId: createMessageDto.receiverId,
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

    return plainToInstance(MessageDTO, message, { excludeExtraneousValues: true });
  }

  async getMessagesByConversation(conversationId: string): Promise<MessageDTO[]> {
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
    // Get user role to determine if they're customer or staff
    const user = await this.prisma.account.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let conversations;

    if (user.role === 'CUSTOMER') {
      // If user is customer, get conversations where they are the customer
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
      // If user is staff, get conversations where they are assigned as staff
      conversations = await this.prisma.conversation.findMany({
        where: { staffId: userId },
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
}
