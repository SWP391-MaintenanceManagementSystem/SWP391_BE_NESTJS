import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDTO {
  @ApiProperty({
    example: '',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Type of the notification',
    enum: NotificationType,
    example: NotificationType.BOOKING,
  })
  @IsEnum(NotificationType, {
    message: `notification_type must be one of: ${Object.values(NotificationType).join(', ')}`,
  })
  @IsNotEmpty()
  notification_type: NotificationType;
}
