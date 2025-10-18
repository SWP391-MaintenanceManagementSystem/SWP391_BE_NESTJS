import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceQueryDTO } from './dto/service-query.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { ServiceQueryCustomerDTO } from './dto/service-query-customer.dto';

@ApiTags('Service')
@Controller('api/services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get('/customer')
  @ApiBearerAuth('jwt-auth')
  async getServicesForCustomer(@Query() query: ServiceQueryCustomerDTO) {
    const { data, page, pageSize, total, totalPages} = await this.serviceService.findAllForCustomer(query)
    return {
      message: 'Successfully',
      data,
      page,
      pageSize,
      total,
      totalPages
    }
  }

  @Get('/admin')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async getServicesForAdmin(@Query() query: ServiceQueryDTO) {
    const { data, page, pageSize, total, totalPages} = await this.serviceService.findAllForAdmin(query)
    return {
      message: 'Successfully',
      data,
      page,
      pageSize,
      total,
      totalPages
    }
  }

  @Get('search/:name')
  @ApiBearerAuth('jwt-auth')
  async getActiveServiceByName(@Param('name') name: string) {
    const services = await this.serviceService.getServiceByNameForCustomer(name)
    return {
      message: 'Successfully',
      data: services
    }
  }

  @Get('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async getServiceByID(@Param('id') id: string) {
    return await this.serviceService.getServiceById(id)
  }

  @Get('search-admin/:name')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async getServiceByName(@Param('name') name: string) {
    const services = await this.serviceService.getServiceByNameForAdmin(name)
    return {
      message: 'Successfully',
      data: services
    }
  }



  @Post('/')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiBody({ type: CreateServiceDto })
  async createService(@Body() dto: CreateServiceDto) {
    return await this.serviceService.create(dto);
  }

  @Patch('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiBody({ type: UpdateServiceDto })
  async updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.serviceService.updateService(id, dto);
  }

  @Delete('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async deleteService(@Param('id') id: string) {
    return this.serviceService.deleteService(id);
  }
}
