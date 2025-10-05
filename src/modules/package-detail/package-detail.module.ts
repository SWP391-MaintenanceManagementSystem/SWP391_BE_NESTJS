import { Module } from '@nestjs/common';
import { PackageDetailService } from './package-detail.service';
import { PackageDetailController } from './package-detail.controller';

@Module({
  controllers: [PackageDetailController],
  providers: [PackageDetailService],
})
export class PackageDetailModule {}
