import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreatePartDto } from './create-part.dto';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PartStatus } from '@prisma/client';

export class UpdatePartDto extends PartialType(CreatePartDto) {
  @ApiPropertyOptional({ example: 'AVAILABLE', enum: PartStatus })
  @IsOptional()
  @IsEnum(PartStatus)
  status?: PartStatus;
}
