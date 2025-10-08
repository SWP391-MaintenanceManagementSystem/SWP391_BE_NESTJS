import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { PackageDetailDto } from 'src/modules/package-detail/dto/package-detail.dto';

export class PackageDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  price: number;

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
  @Transform(({ obj }) => {
    if (obj.totalPrice) return obj.totalPrice;

    const details: PackageDetailDto[] = obj.packageDetails || [];
    const servicesTotal = details.reduce((sum, pd) => {
      const servicePrice = pd.service?.price || 0;
      return sum + servicePrice * (pd.quantity || 1);
    }, 0);

    const subtotal = (obj.price || 0) + servicesTotal;
    const discount = obj.discountRate || 0;
    return subtotal * (1 - discount / 100);
  })
  totalPrice: number;
}
