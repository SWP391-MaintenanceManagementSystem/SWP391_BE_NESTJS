import { ApiProperty } from '@nestjs/swagger';
import { Part, ServicePart } from '@prisma/client';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PackageDetailDto } from 'src/modules/package-detail/dto/package-detail.dto';
import { PartDto } from 'src/modules/part/dto/part.dto';
import ServicePartDto from 'src/modules/service-part/dto/service-part.dto';

export class ServiceDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  id: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  name: string;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string | null;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Expose()
  price: number;

  @IsNotEmpty()
  @IsString()
  @Expose()
  status: string;

  @IsNotEmpty()
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  createdAt: Date;

  @IsNotEmpty()
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  updatedAt: Date;


  @IsOptional()
  @Expose()
  bookingDetails?: any[];

  @IsOptional()
  @Expose()
  packageDetails?: PackageDetailDto[];

  @IsOptional()
  @Expose()
  serviceParts?: ServicePartDto[];

  @ApiProperty({
    type: () => [PartDto],
    description: 'List of parts included in the service',
  })
  @Expose()
  @Type(() => PartDto)
  parts?: PartDto[];

  @Expose()
@Transform(({ obj }) => {
  if (obj && typeof obj.finalPrice === 'number') return obj.finalPrice;
  const parts = obj?.parts || [];
  if (Array.isArray(parts) && parts.length > 0) {
    const partsTotal = parts.reduce((sum, part) => sum + (part.price || 0), 0);
    return (obj.price || 0) + partsTotal;
  }
  return obj?.price ?? 0;
})
finalPrice: number;
}
