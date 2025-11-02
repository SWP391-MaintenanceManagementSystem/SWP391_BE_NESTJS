import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { TrendingItemDTO } from './trending-item.dto';

export class TrendingSummaryDTO {
  @ApiProperty()
  @Expose()
  mostPopularService: string;

  @ApiProperty()
  @Expose()
  mostPopularPackage: string;

  @ApiProperty()
  @Expose()
  mostPopularMembership: string;

  @ApiProperty({ type: [TrendingItemDTO] })
  @Expose()
  @Type(() => TrendingItemDTO)
  services: TrendingItemDTO[];

  @ApiProperty({ type: [TrendingItemDTO] })
  @Expose()
  @Type(() => TrendingItemDTO)
  packages: TrendingItemDTO[];

  @ApiProperty({ type: [TrendingItemDTO] })
  @Expose()
  @Type(() => TrendingItemDTO)
  memberships: TrendingItemDTO[];
}
