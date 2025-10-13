import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePartDto {
  @ApiProperty({ description: 'Name of the part' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the part', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price of the part' })
  @IsNotEmpty()
  price: number;

  @ApiProperty({ description: 'Current stock quantity' })
  @IsNotEmpty()
  stock: number;

  @ApiProperty({ description: 'Minimum stock quantity before reordering' })
  @IsNotEmpty()
  minStock: number;

  @ApiProperty({ description: 'ID of the category this part belongs to' })
  @IsString()
  categoryId: string;
}
