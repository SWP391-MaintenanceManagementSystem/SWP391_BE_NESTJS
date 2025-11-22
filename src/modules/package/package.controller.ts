import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { PakageQueryDTO } from './dto/pakage-query.dto';

@ApiTags('Package')
@Controller('api/packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post()
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  create(@Body() createPackageDto: CreatePackageDto) {
    return this.packageService.createPackage(createPackageDto);
  }

  @Get()
  @Roles(AccountRole.ADMIN, AccountRole.CUSTOMER)
  @ApiBearerAuth('jwt-auth')
  async findAll(@Query() query: PakageQueryDTO) {
    const { data, page, pageSize, total, totalPages } =
      await this.packageService.getAllPackages(query);
    return {
      message: 'Successfully',
      data,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  @Get('/admin')
  @Roles(AccountRole.ADMIN, AccountRole.CUSTOMER)
  @ApiBearerAuth('jwt-auth')
  async getAllPakagesForAdmin(@Query() query: PakageQueryDTO) {
    const { data, page, pageSize, total, totalPages } =
      await this.packageService.getAllPackagesForAdmin(query);
    return {
      message: 'Successfully',
      data,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  @Get(':id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  findOne(@Param('id') id: string) {
    return this.packageService.getPackageById(id);
  }

  @Patch(':id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  update(@Param('id') id: string, @Body() updatePackageDto: UpdatePackageDto) {
    return this.packageService.updatePackage(id, updatePackageDto);
  }

  @Delete(':id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  remove(@Param('id') id: string) {
    return this.packageService.deletePackage(id);
  }

  @Get('/search/:name')
  @ApiBearerAuth('jwt-auth')
  async getActivePackageByName(@Param('name') name: string) {
    const packages = await this.packageService.getPackageByNameForCustomer(name);
    return {
      message: 'Search packages successfully',
      data: packages,
    };
  }
}
