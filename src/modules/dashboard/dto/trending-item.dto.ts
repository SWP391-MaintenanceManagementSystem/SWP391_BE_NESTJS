import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TrendingItemDTO {
  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  value: number;
}
