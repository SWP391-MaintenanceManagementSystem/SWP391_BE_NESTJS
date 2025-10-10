import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';

@ApiTags('Package')
@Controller('api/package')
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
  async findAll() {
    const data = await this.packageService.getAllPackages();
    return {
      data: data,
      message: 'Get all packages successfully'
    };
  }

  @Get(':id')
  @Roles(AccountRole.ADMIN, AccountRole.CUSTOMER)
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
}
