import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreatePartDto } from './create-part.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { PartStatus } from '@prisma/client';

export class UpdatePartDto extends PartialType(CreatePartDto) {
  @IsOptional()
  @IsEnum(PartStatus)
  @ApiProperty({
    required: false,
    description: 'Status of the part (AVAILABLE, OUT_OF_STOCK, DISCONTINUED)',
    enum: PartStatus,
  })
  status?: PartStatus;
}
