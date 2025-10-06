import { PartialType } from '@nestjs/swagger';
import { CreateServicePartDto } from './create-service-part.dto';

export class UpdateServicePartDto extends PartialType(CreateServicePartDto) {}
