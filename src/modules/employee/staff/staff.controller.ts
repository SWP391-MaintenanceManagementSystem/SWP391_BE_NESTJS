import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { StaffService } from './staff.service';
import { ApiTags, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateStaffDTO } from './dto/create-staff.dto';
import { UpdateStaffDTO } from './dto/update-staff.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { EmployeeQueryDTO, EmployeeQueryWithPaginationDTO } from '../dto/employee-query.dto';
import { plainToInstance } from 'class-transformer';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { JWT_Payload } from 'src/common/types';

@ApiTags('Staffs')
@Controller('api/staffs')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('/')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async getStaffs(@Query() query: EmployeeQueryWithPaginationDTO) {
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

  @Get('/me/dashboard')
  @Roles(AccountRole.STAFF)
  @ApiBearerAuth('jwt-auth')
  async getMyDashboard(@CurrentUser() user: JWT_Payload) {
  const staffId = user.sub;
  const data = await this.staffService.getStaffDashboard(staffId);

  return {
    message: 'Your dashboard retrieved successfully',
    data,
  };
}

  @Post('/')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiBody({ type: CreateStaffDTO })
  async createStaff(@Body() createStaffDto: CreateStaffDTO) {
    return this.staffService.createStaff(createStaffDto);
  }

  @Patch('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiBody({ type: UpdateStaffDTO })
  async updateStaff(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDTO) {
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
