import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCategoryDto {
     @ApiProperty({
    example: 'Engine Parts',
    description: 'Name of the category',
  })
  @IsNotEmpty({ message: 'Category name must not be empty' })
  @IsString({ message: 'Category name must be a string' })
  @MinLength(2, { message: 'Category name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Category name must not exceed 100 characters' })
  name: string;
}
