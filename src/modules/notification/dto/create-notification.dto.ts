import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDTO {
  @ApiProperty({ description: 'Account ID associated with the notification' })
  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ example: 'Content', description: 'Content of the notification' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Type of the notification', enum: NotificationType })
  @IsString()
  @IsNotEmpty()
  notification_type: NotificationType;
}
