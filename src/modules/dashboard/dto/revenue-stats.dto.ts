import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { RevenueByDateDTO } from './revenue-by-date.dto';

export class RevenueStatsDTO {
  @ApiProperty({ example: 'last_90_days' })
  @Expose()
  range: string;

  @ApiProperty({ type: [RevenueByDateDTO] })
  @Expose()
  @Type(() => RevenueByDateDTO)
  data: RevenueByDateDTO[];
}
