import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PartDto } from 'src/modules/part/dto/part.dto';

export class CategoryDto {
  @IsNotEmpty()
  @Expose()
  @IsString()
  id: string;

  @IsNotEmpty()
  @Expose()
  @IsString()
  name: string;

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
  parts?: PartDto[]; // TODO: define PartDTO if needed
}
