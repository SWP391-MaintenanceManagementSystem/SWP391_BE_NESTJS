import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { CategoryDto } from 'src/modules/category/dto/category.dto';
import ServicePartDto from 'src/modules/service-part/dto/service-part.dto';
import { PartStatus } from '@prisma/client';

@Exclude()
export class PartDto {
  @ApiProperty({ description: 'ID of the part' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Name of the part' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Description of the part', required: false })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Price of the part' })
  @Expose()
  price: number;

  @ApiProperty({ description: 'Current stock quantity' })
  @Expose()
  quantity: number;

  @ApiProperty({ description: 'Current stock quantity'})
  @Exclude()
  stock: number;

  @ApiProperty({ description: 'Minimum stock quantity before reordering' })
  @Expose()
  minStock: number;

  @ApiProperty({ description: 'ID of the category this part belongs to' })
  @Expose()
  categoryId: string;

  @ApiProperty({ description: 'Creation date' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: 'Computed stock status' })
  @Expose()
  status: PartStatus;

  @ApiProperty({ type: () => CategoryDto, description: 'Category of the part' })
  @Expose()
  @Type(() => CategoryDto)
  category: CategoryDto;

  @ApiProperty({
    type: () => [ServicePartDto],
    description: 'List of service-part relations (temporary: any)',
  })
  @Expose()
  @Type(() => ServicePartDto)
  serviceParts: ServicePartDto[];
}
