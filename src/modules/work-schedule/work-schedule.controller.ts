import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { WorkScheduleService } from './work-schedule.service';
import { WorkScheduleQueryDTO } from './dto/work-schedule-query.dto';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { AccountRole } from '@prisma/client';
import { CreateCyclicWorkScheduleDTO } from './dto/create-cyclic-work-schedule.dto';
import { UpdateCyclicWorkScheduleDTO } from './dto/update-cyclic-work-schedule.dto';

@ApiTags('Work Schedules')
@Controller('api/work-schedules')
@UseGuards(RoleGuard)
@ApiBearerAuth('jwt-auth')
export class WorkScheduleController {
  constructor(private readonly workScheduleService: WorkScheduleService) {}

  @Post()
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: CreateCyclicWorkScheduleDTO })
  async createWorkSchedule(
    @Body() createCyclicDto: CreateCyclicWorkScheduleDTO,
    @CurrentUser() user: any
  ) {
    const data = await this.workScheduleService.createCyclicWorkSchedule(
      createCyclicDto,
      user.role
    );
    return {
      message: 'Work schedules created successfully',
      data,
      count: data.length,
    };
  }

  @Get()
  @Roles(AccountRole.ADMIN, AccountRole.STAFF, AccountRole.TECHNICIAN)
  async getWorkSchedules(@Query() query: WorkScheduleQueryDTO, @CurrentUser() user: any) {
    const { data, page, pageSize, total, totalPages } =
      await this.workScheduleService.getWorkSchedules(query, user.role, user.sub);

    return {
      message: 'Work schedules retrieved successfully',
      data,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  @Get(':id')
  @Roles(AccountRole.ADMIN, AccountRole.STAFF, AccountRole.TECHNICIAN)
  async getWorkScheduleById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    const data = await this.workScheduleService.getWorkScheduleById(id, user.role, user.sub);
    return {
      message: 'Work schedule retrieved successfully',
      data,
    };
  }

  @Patch(':employeeId/:shiftId')
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: UpdateCyclicWorkScheduleDTO })
  async updateWorkSchedule(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Body() updateDto: UpdateCyclicWorkScheduleDTO,
    @CurrentUser() user: any
  ) {
    const data = await this.workScheduleService.updateCyclicWorkSchedule(
      employeeId,
      shiftId,
      updateDto,
      user.role
    );
    return {
      message: 'Work schedules updated successfully',
      data,
      count: data.length,
    };
  }

  @Delete(':employeeId')
  @Roles(AccountRole.ADMIN)
  async deleteWorkSchedule(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @CurrentUser() user: any
  ) {
    const data = await this.workScheduleService.deleteWorkSchedule(employeeId, user.role);
    return {
      message: 'Work schedule deleted successfully',
      data,
    };
  }
}
