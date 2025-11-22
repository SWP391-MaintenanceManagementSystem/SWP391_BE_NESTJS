import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServicePartService } from './service-part.service';
import { CreateServicePartDto } from './dto/create-service-part.dto';
import { UpdateServicePartDto } from './dto/update-service-part.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';

@ApiTags('Service Parts')
@Controller('api/service-parts')
export class ServicePartController {
  constructor(private readonly servicePartService: ServicePartService) {}

  @Post()
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  create(@Body() createServicePartDto: CreateServicePartDto) {
    return this.servicePartService.createServicePart(createServicePartDto);
  }

  @Get()
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  findAll() {
    return this.servicePartService.getAllServiceParts();
  }

  @Get(':id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  findOne(@Param('id') id: string) {
    return this.servicePartService.getServicePartById(id);
  }

  @Patch(':id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  update(@Param('id') id: string, @Body() updateServicePartDto: UpdateServicePartDto) {
    return this.servicePartService.updateServicePart(id, updateServicePartDto);
  }

  @Delete(':id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  remove(@Param('id') id: string) {
    return this.servicePartService.deleteServicePart(id);
  }
}
