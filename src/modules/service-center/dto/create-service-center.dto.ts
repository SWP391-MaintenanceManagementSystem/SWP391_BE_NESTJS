import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CenterStatus } from '@prisma/client';

export class CreateServiceCenterDTO {
  @ApiProperty({ example: 'Main Service Center' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '123 Main St, City, Country' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'OPEN', enum: CenterStatus })
  @IsEnum(CenterStatus)
  @IsString()
  @IsNotEmpty()
  status: CenterStatus;
}
