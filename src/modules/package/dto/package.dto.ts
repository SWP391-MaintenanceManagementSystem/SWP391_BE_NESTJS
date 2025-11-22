import { ApiProperty } from '@nestjs/swagger';
import { PackageStatus } from '@prisma/client';
import { Expose, Transform, Type } from 'class-transformer';
import { PackageDetailDto } from 'src/modules/package-detail/dto/package-detail.dto';

export class PackageDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  discountRate: number;

  @Expose()
  status?: PackageStatus;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @ApiProperty({
    type: () => [PackageDetailDto],
    description: 'List of service details included in the package',
  })
  @Expose()
  @Type(() => PackageDetailDto)
  packageDetails: PackageDetailDto[];

  @Expose()
  price: number;
}
