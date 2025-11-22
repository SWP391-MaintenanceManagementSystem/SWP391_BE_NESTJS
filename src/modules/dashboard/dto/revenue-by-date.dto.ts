import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RevenueByDateDTO {
  @ApiProperty({ example: '2025-09-25' })
  @Expose()
  date: string;

  @ApiProperty({ example: 4200 })
  @Expose()
  totalRevenue: number;
}
