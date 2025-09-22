import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { ApiTags, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Employee } from '@prisma/client';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { FilterTechnicianDto } from './dto/filter-technician.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';

@ApiTags('Technician')
@Controller('api/employee/role/technician')
export class TechnicianController {
  constructor(private readonly technicianService: TechnicianService) {}

  @Get('/')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiQuery({
    name: 'where',
    required: false,
    type: String,
    description: 'JSON string for filter conditions',
    example: '{"status":"ACTIVE"}',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    type: String,
    description: 'JSON string for sorting criteria',
    example: '{"createdAt":"desc"}',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Number of records per page',
    example: 10,
  })
  async getTechnicians(
    @Query('where') where?: string,
    @Query('orderBy') orderBy?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const {
      data,
      page: _page,
      pageSize: _pageSize,
      total,
      totalPages,
    } = await this.technicianService.getTechnicians({
      where: where ? JSON.parse(where) : undefined,
      orderBy: orderBy ? JSON.parse(orderBy) : undefined,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 10,
    });
    return {
      message: 'Technicians retrieved successfully',
      data,
      page: _page,
      pageSize: _pageSize,
      total,
      totalPages,
    };
  }

  @Get('/:id')
  @Roles(AccountRole.TECHNICIAN)
  @ApiBearerAuth('jwt-auth')
  async getTechnicianById(@Param('id') id: string) {
    return this.technicianService.getTechnicianById(id);
  }

  @Post('/create')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiBody({ type: CreateTechnicianDto })
  async createTechnician(@Body() createTechnicianDto: CreateTechnicianDto) {
    return this.technicianService.createTechnician(createTechnicianDto);
  }

  @Put('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiBody({ type: UpdateTechnicianDto })
  async updateTechnician(
    @Param('id') id: string,
    @Body() updateTechnicianDto: UpdateTechnicianDto
  ) {
    return this.technicianService.updateTechnician(id, updateTechnicianDto);
  }

  @Delete('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async deleteTechnician(@Param('id') id: string) {
    return this.technicianService.deleteTechnician(id);
  }
}
