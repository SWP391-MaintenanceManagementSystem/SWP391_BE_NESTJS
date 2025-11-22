import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { TrendingItemDTO } from './trending-item.dto';

export class TrendingSummaryDTO {
  @ApiProperty({ type: [String] })
  @Expose()
  mostPopularService: string[];

  @ApiProperty({ type: [String] })
  @Expose()
  mostPopularPackage: string[];

  @ApiProperty({ type: [String] })
  @Expose()
  mostPopularMembership: string[];

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
