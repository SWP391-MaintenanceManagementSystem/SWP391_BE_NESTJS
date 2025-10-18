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

  // Quan hệ (nếu bạn muốn expose)
  // Service có nhiều bookingDetails, packageDetails, serviceParts
  // Nếu bạn muốn lazy load hay join DTO thì để đây, còn không có thể exclude
  @IsOptional()
  @Expose()
  bookingDetails?: any[]; // TODO: define BookingDetailDTO nếu cần

  @IsOptional()
  @Expose()
  packageDetails?: PackageDetailDto[]; // TODO: define PackageDetailDTO nếu cần

  @IsOptional()
  @Expose()
  serviceParts?: ServicePartDto[]; // TODO: define ServicePartDTO nếu cần

  @ApiProperty({
    type: () => [PartDto],
    description: 'List of parts included in the service',
  })
  @Expose()
  @Type(() => PartDto)
  parts: PartDto[];

  @ApiProperty({ description: 'Final price = price + sum(parts.price)' })
  @Expose()
  @Transform(({ obj }) => {
    const parts: PartDto[] = obj.parts || [];
    const partsTotal = parts.reduce((sum, part) => sum + (part.price || 0), 0);
    return (obj.price || 0) + partsTotal;
  })
  finalPrice: number;
}
