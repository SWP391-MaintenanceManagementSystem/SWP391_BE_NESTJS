import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PackageDetailService } from './package-detail.service';
import { CreatePackageDetailDto } from './dto/create-package-detail.dto';
import { UpdatePackageDetailDto } from './dto/update-package-detail.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';

@ApiTags('Package Detail')
@Controller('package-detail')
export class PackageDetailController {
  constructor(private readonly packageDetailService: PackageDetailService) {}

  @Post()
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  create(@Body() createPackageDetailDto: CreatePackageDetailDto) {
    return this.packageDetailService.createPackage(createPackageDetailDto);
  }

  @Get()
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  findAll() {
    return this.packageDetailService.getAllPackageDetail();
  }

  @Get(':packageId/:serviceId')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  findOne(@Param('packageId') packageId: string, @Param('serviceId') serviceId: string) {
    return this.packageDetailService.getPackageDetailById(packageId, serviceId);
  }

  @Patch(':packageId/:serviceId')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  update(
    @Param('packageId') packageId: string,
    @Param('serviceId') serviceId: string,
    @Body() updatePackageDetailDto: UpdatePackageDetailDto
  ) {
    return this.packageDetailService.updatePackageDetail(
      packageId,
      serviceId,
      updatePackageDetailDto
    );
  }

  @Delete(':packageId/:serviceId')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  remove(@Param('packageId') packageId: string, @Param('serviceId') serviceId: string) {
    return this.packageDetailService.deletePackageDetail(packageId, serviceId);
  }
}
