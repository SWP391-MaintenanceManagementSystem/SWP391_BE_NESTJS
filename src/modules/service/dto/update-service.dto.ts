import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ServiceStatus } from '@prisma/client';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
    @IsOptional()
  @IsString()
  status?: ServiceStatus;
}
