import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

class Part {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  quantity: number;

  @Expose()
  price: number;
}

export class ServiceDetailDTO {
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

  @Expose()
  @Type(() => Part)
  parts: Part[];
}
