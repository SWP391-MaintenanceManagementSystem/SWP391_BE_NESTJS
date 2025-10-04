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
    );
    return {
      message: 'Work schedules updated successfully',
      data,
      count: data.length,
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
    const data = await this.workScheduleService.deleteWorkSchedule(id, user.role, user.sub);
    return {
      message: 'Work schedule deleted successfully',
      data,
    }
  }
}
