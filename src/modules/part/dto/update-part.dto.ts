import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreatePartDto } from './create-part.dto';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PartStatus } from '@prisma/client';

export class UpdatePartDto extends PartialType(CreatePartDto) {
  @ApiPropertyOptional({ example: 'AVAILABLE', enum: PartStatus })
  @IsOptional()
  @IsEnum(PartStatus)
  status?: PartStatus;
}

export class RefillPartDto {
  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1, { message: 'Refill amount must be greater than 0' })
  refillAmount: number;
}
