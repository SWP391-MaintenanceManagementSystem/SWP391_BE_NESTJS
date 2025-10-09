import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CenterStatus } from '@prisma/client';

export class UpdateServiceCenterDTO {
  @ApiProperty({ example: 'Main Service Center' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '123 Main St, City, Country' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'OPEN', enum: CenterStatus })
  @IsEnum(CenterStatus)
  @IsString()
  @IsOptional()
  status?: CenterStatus;
}
