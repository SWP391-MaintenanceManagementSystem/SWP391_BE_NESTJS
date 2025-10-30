import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { MessageDTO } from './dto/message.dto';
import { ConversationDTO } from './dto/conversation.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateMessageDTO } from './dto/create-message.dto';
import { JWT_Payload } from 'src/common/types';
@ApiBearerAuth('jwt-auth')
@ApiTags('Chats')
@UseGuards(JwtAuthGuard)
@Controller('api/chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations/:conversationId/messages')
  async getMessagesByConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() currentUser: JWT_Payload
  ) {
    const messages = await this.chatService.getMessagesByConversation(
      conversationId,
      currentUser.sub
    );
    return {
      data: messages,
      message: 'Messages retrieved successfully.',
    };
  }

  @Get('conversations')
  async getUserConversations(@CurrentUser() currentUser: JWT_Payload) {
    const conversations = await this.chatService.getUserConversations(currentUser.sub);
    return {
      data: conversations,
      message: 'User conversations retrieved successfully.',
    };
  }

  @Post('messages')
  async createMessage(
    @Body() createMessageDto: CreateMessageDTO,
    @CurrentUser() user: JWT_Payload
  ) {
    const message = await this.chatService.createMessage(user.sub, createMessageDto);
    return {
      data: message,
      message: 'Message created successfully.',
    };
  }

  @Post('conversations/:conversationId/claim')
  async claimConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JWT_Payload
  ) {
    const conversation = await this.chatService.assignStaffToConversation(conversationId, user.sub);
    return {
      data: conversation,
      message: 'Conversation claimed successfully.',
    };
  }

  @Post('conversations/:conversationId/close')
  async closeConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JWT_Payload
  ) {
    const conversation = await this.chatService.closeConversation(conversationId, user.sub);
    return {
      data: conversation,
      message: 'Conversation closed successfully.',
    };
  }
}
