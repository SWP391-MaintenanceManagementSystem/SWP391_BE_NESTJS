import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateNotificationDTO {
  @ApiPropertyOptional({
    description: 'Mark notification as read',
    example: true,
  })
  @IsOptional()
  is_read?: boolean;

  @ApiPropertyOptional({
    description: 'Timestamp when notification was read',
    example: '2024-01-20T08:00',
  })
  @IsOptional()
  @IsDateString()
  read_at?: string;
}
