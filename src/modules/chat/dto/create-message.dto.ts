import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDTO {
  @ApiProperty({
    required: false,
    description:
      'Existing conversation ID. If not provided, a new ticket/conversation may be created',
  })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({
    required: true,
    example: 'customer-or-staff-user-id',
    description: 'ID of the recipient (customer or staff)',
  })
  @IsNotEmpty()
  @IsString()
  receiverId: string;

  @ApiProperty({
    required: true,
    example: 'Hello, how can I help you?',
    description: 'Message content',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
