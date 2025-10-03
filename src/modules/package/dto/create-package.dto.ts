import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { PackageDetailDto } from "src/modules/package-detail/dto/package-detail.dto";

export class CreatePackageDto {
  @ApiProperty({ example: 'Basic Maintenance Package' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 1200000 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ example: 1500000})
  @IsOptional()
  @IsNumber()
  @IsPositive()
  totalPrice?: number;

  @ApiPropertyOptional({ example: 10})
  @IsOptional()
  @IsNumber()
  @IsPositive()
  discountRate?: number;

  @ApiPropertyOptional({ type: [String], description: 'List of service IDs to include in this package' })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  serviceIds?: string[];
}
