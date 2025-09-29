import { ApiProperty } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

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
  packageDetails?: any[]; // TODO: define PackageDetailDTO nếu cần

  @IsOptional()
  @Expose()
  serviceParts?: any[]; // TODO: define ServicePartDTO nếu cần
}
