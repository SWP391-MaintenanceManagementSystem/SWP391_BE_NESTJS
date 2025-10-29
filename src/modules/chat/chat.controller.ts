import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { MessageDTO } from './dto/message.dto';
import { ConversationDTO } from './dto/conversation.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';
import { CreateMessageDTO } from './dto/create-message.dto';
import { JWT_Payload } from 'src/common/types';

@Controller('chats')
@ApiTags('Chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations/:conversationId/messages')
  async getMessagesByConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() currentUser: JWT_Payload
  ): Promise<MessageDTO[]> {
    return this.chatService.getMessagesByConversation(conversationId, currentUser.sub);
  }

  @Get('conversations')
  async getUserConversations(@CurrentUser() currentUser: any): Promise<ConversationDTO[]> {
    return this.chatService.getUserConversations(currentUser.id);
  }

  @Post('messages')
  async createMessage(
    @Body() createMessageDto: CreateMessageDTO,
    @CurrentUser() user: JWT_Payload
  ): Promise<MessageDTO> {
    return this.chatService.createMessage(user.sub, createMessageDto);
  }

  @Post('conversations/:conversationId/claim')
  async claimConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JWT_Payload
  ): Promise<ConversationDTO> {
    return this.chatService.assignStaffToConversation(conversationId, user.sub);
  }

  @Post('conversations/:conversationId/close')
  async closeConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JWT_Payload
  ): Promise<ConversationDTO> {
    return this.chatService.closeConversation(conversationId, user.sub);
  }
}
