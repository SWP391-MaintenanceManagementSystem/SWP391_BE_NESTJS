import { VehicleStatus } from '@prisma/client';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class VehicleDTO {
  @IsNotEmpty()
  @IsString()
  @Expose()
  id: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  vin: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  licensePlate: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  model: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  brand: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  status: VehicleStatus;

  @IsNotEmpty()
  @IsString()
  @Exclude()
  customerId: string;

  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @Expose()
  lastService?: Date | null;

  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @Expose()
  deletedAt?: Date | null;

  @IsNotEmpty()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @Expose()
  createdAt: Date;

  @IsNotEmpty()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @Expose()
  updatedAt: Date;
}
