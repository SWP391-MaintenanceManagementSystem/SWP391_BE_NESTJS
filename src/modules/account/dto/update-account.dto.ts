import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateAccountDTO {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'John' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Doe' })
  lastName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '123 Main St, City, Country' })
  address?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '+1234567890' })
  phone?: string;
}
