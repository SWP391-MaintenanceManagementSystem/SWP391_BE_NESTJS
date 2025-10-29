import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateMessageDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ required: true, example: 'receiver-user-id' })
  @IsNotEmpty()
  @IsString()
  receiverId: string;

  @ApiProperty({ required: true, example: 'Hello, how can I help you?' })
  @IsNotEmpty()
  @IsString()
  content: string;
}
