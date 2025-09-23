import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTechnicianDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'John' })
  firstName: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Doe' })
  lastName: string;
}
