import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
