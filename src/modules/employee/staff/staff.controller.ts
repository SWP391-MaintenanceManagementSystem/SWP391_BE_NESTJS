import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { StaffService } from './staff.service';
import { ApiTags, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';

@ApiTags('Staff')
@Controller('api/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) { }

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
  async getStaffs(
    @Query('where') where?: string,
    @Query('orderBy') orderBy?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const {
      data,
      page: _page,
      pageSize: _pageSize,
      total,
      totalPages,
    } = await this.staffService.getStaffs({
      where: where ? JSON.parse(where) : undefined,
      orderBy: orderBy ? JSON.parse(orderBy) : undefined,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 10,
    });

    return {
      message: 'Staffs retrieved successfully',
      data,
      page: _page,
      pageSize: _pageSize,
      total,
      totalPages,
    };
  }

  @Get('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async getStaffById(@Param('id') id: string) {
    return this.staffService.getStaffById(id);
  }

  @Post('/create')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiBody({ type: CreateStaffDto })
  async createStaff(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.createStaff(createStaffDto);
  }

  @Patch('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiBody({ type: UpdateStaffDto })
  async updateStaff(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return this.staffService.updateStaff(id, updateStaffDto);
  }

  @Delete('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async deleteStaff(@Param('id') id: string) {
    return this.staffService.deleteStaff(id);
  }
}