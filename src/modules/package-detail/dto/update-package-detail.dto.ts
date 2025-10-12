import { PartialType } from '@nestjs/swagger';
import { CreatePackageDetailDto } from './create-package-detail.dto';

export class UpdatePackageDetailDto extends PartialType(CreatePackageDetailDto) {}
