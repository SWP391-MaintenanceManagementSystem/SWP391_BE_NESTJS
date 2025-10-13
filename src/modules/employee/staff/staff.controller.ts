import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { StaffService } from './staff.service';
import { ApiTags, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { EmployeeQueryDTO } from '../dto/employee-query.dto';
import { plainToInstance } from 'class-transformer';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';

@ApiTags('Staff')
@Controller('api/staffs')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('/')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async getStaffs(@Query() query: EmployeeQueryDTO) {
    const { data, page, pageSize, total, totalPages } = await this.staffService.getStaffs(query);
    const staffs = data.map(staff => plainToInstance(AccountWithProfileDTO, staff));
    return {
      message: 'Staffs retrieved successfully',
      data: staffs,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  @Get('/statistics')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async getStaffStatusStats() {
    const { data, total } = await this.staffService.getStaffStatistics();
    return {
      message: 'Staff status statistics retrieved successfully',
      data,
      total,
    };
  }

  @Get('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async getStaffById(@Param('id') id: string) {
    return this.staffService.getStaffById(id);
  }

  @Post('/')
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
  async updateStaff(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.updateStaff(id, updateStaffDto);
  }

  @Delete('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async deleteStaff(@Param('id') id: string) {
    return this.staffService.deleteStaff(id);
  }

  @Patch('/:id/reset-password')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async resetStaffPassword(@Param('id') id: string) {
    await this.staffService.resetStaffPassword(id);
    return { message: `Password for staff ${id} has been reset to default` };
  }
}
