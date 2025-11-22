import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ServiceCenterStatsDTO {
  @ApiProperty({ example: 'Hà Nội Service Center' })
  @Expose()
  centerName: string;

  @ApiProperty({ example: 32 })
  @Expose()
  bookings: number;
}
