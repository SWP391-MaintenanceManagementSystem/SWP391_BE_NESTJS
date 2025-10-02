import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { WorkScheduleService } from './work-schedule.service';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';
import { WorkScheduleQueryDto } from './dto/work-schedule-query.dto';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { AccountRole } from '@prisma/client';

@ApiTags('Work Schedule')
@Controller('api/work-schedule')
@UseGuards(RoleGuard)
@ApiBearerAuth('jwt-auth')
export class WorkScheduleController {
  constructor(private readonly workScheduleService: WorkScheduleService) {}

  @Post()
  @Roles(AccountRole.ADMIN)
  @ApiOperation({
    summary: 'Create work schedule assignments (ADMIN only)',
    description: 'Assign multiple STAFF and TECHNICIAN employees to a shift for a specific date. Creates multiple WorkSchedule records (one per employee).'
  })
  @ApiBody({ type: CreateWorkScheduleDto })
  async createWorkSchedule(
    @Body() createDto: CreateWorkScheduleDto,
    @CurrentUser() user: any
  ) {
    const data = await this.workScheduleService.createWorkSchedule(
      createDto,
      user.role,
      user.sub
    );
    return {
      message: 'Work schedules created successfully',
      data,
    };
  }

  @Get()
  @Roles(AccountRole.ADMIN, AccountRole.STAFF, AccountRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Get work schedules (filtered by role)',
    description: 'ADMIN: All schedules. STAFF: Own centers + own schedules. TECHNICIAN: Own schedules only.'
  })
  async getWorkSchedules(
    @Query() query: WorkScheduleQueryDto,
    @CurrentUser() user: any
  ) {
    const { data, page, pageSize, total, totalPages } = await this.workScheduleService.getWorkSchedules(
      query,
      user.role,
      user.sub
    );

    return {
      message: 'Work schedules retrieved successfully',
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  @Get(':id')
  @Roles(AccountRole.ADMIN, AccountRole.STAFF, AccountRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Get work schedule by ID (role-based access)',
    description: 'ADMIN: Any schedule. STAFF: Own centers + own schedules. TECHNICIAN: Own schedules only.'
  })
  async getWorkScheduleById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any
  ) {
    const data = await this.workScheduleService.getWorkScheduleById(id, user.role, user.sub);
    return {
      message: 'Work schedule retrieved successfully',
      data,
    };
  }

  @Patch('shift/:shiftId/date/:date')
  @Roles(AccountRole.ADMIN)
  @ApiOperation({
    summary: 'Update work schedule assignments for a shift on specific date (ADMIN only)',
    description: 'Replace all employee assignments for a specific shift and date. Removes existing assignments and creates new ones.'
  })
  @ApiBody({ type: UpdateWorkScheduleDto })
  async updateWorkSchedule(
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Param('date') date: string,
    @Body() updateDto: UpdateWorkScheduleDto,
    @CurrentUser() user: any
  ) {
    const data = await this.workScheduleService.updateWorkSchedule(
      shiftId,
      date,
      updateDto,
      user.role,
      user.sub
    );
    return {
      message: 'Work schedules updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(AccountRole.ADMIN)
  @ApiOperation({
    summary: 'Remove specific work schedule assignment (ADMIN only)',
    description: 'Remove a specific employee assignment from a shift on a specific date.'
  })
  async deleteWorkSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any
  ) {
    const result = await this.workScheduleService.deleteWorkSchedule(id, user.role, user.sub);
    return result;
  }

  @Get('shift/:shiftId/date/:date/employees')
  @Roles(AccountRole.ADMIN, AccountRole.STAFF)
  @ApiOperation({
    summary: 'Get all employees assigned to a shift on specific date',
    description: 'ADMIN: Any shift. STAFF: Only shifts in assigned centers.'
  })
  async getEmployeesInShift(
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Param('date') date: string,
    @CurrentUser() user: any
  ) {
    const data = await this.workScheduleService.getEmployeesInShift(
      shiftId,
      date,
      user.role,
      user.sub
    );

    return {
      message: 'Employees in shift retrieved successfully',
      data,
      meta: {
        shiftId,
        date,
        totalEmployees: data.length,
        maxCapacity: data[0]?.shift?.maximumSlot || null
      }
    };
  }

  //EXTRA: Get my work schedule (for TECHNICIAN)
  // @Get('me/schedule')
  // @Roles(AccountRole.TECHNICIAN, AccountRole.STAFF)
  // @ApiOperation({
  //   summary: 'Get my work schedule (TECHNICIAN/STAFF only)',
  //   description: 'Get current user\'s own work schedule assignments.'
  // })
  // async getMySchedule(
  //   @Query() query: WorkScheduleQueryDto,
  //   @CurrentUser() user: any
  // ) {
  //   // Force filter by current user's employeeId
  //   const myQuery = { ...query, employeeId: user.sub };

  //   const { data, page, pageSize, total, totalPages } = await this.workScheduleService.getWorkSchedules(
  //     myQuery,
  //     user.role,
  //     user.sub
  //   );

  //   return {
  //     message: 'Your work schedule retrieved successfully',
  //     data,
  //     pagination: {
  //       page,
  //       pageSize,
  //       total,
  //       totalPages,
  //     },
  //   };
  // }

}
