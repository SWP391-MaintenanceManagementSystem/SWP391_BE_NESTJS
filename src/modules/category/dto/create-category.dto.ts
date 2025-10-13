import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Engine Parts',
    description: 'Name of the category',
  })
  @IsNotEmpty({ message: 'Category name is required' })
  @IsString({ message: 'Category name must be a string' })
  @MaxLength(100, { message: 'Category name must not exceed 100 characters' })
  name: string;

}
