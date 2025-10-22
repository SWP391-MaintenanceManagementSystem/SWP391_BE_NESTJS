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
import { CreateWorkScheduleDTO } from './dto/create-work-schedule.dto';

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

  @Patch(':employeeId/:shiftId/:date')
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: UpdateCyclicWorkScheduleDTO })
  async updateWorkSchedule(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Param('date') date: string,
    @Body() updateDto: UpdateCyclicWorkScheduleDTO,
    @CurrentUser() user: any
  ) {
    const data = await this.workScheduleService.updateCyclicWorkSchedule(
      employeeId,
      shiftId,
      date,
      updateDto,
      user.role
    );
    return {
      message: 'Work schedule updated successfully',
      data,
      count: data.length,
    };
  }

  @Post('single')
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: CreateWorkScheduleDTO })
  async createSingleWorkSchedule(
    @Body() createDto: CreateWorkScheduleDTO,
    @CurrentUser() user: any
  ) {
    const data = await this.workScheduleService.createSingleWorkSchedule(createDto, user.role);
    return {
      message: 'Work schedule created successfully',
      data,
    };
  }

  @Delete(':employeeId/:date')
  @Roles(AccountRole.ADMIN)
  async deleteWorkSchedule(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('date') date: string,
    @CurrentUser() user: any
  ) {
    const data = await this.workScheduleService.deleteWorkSchedule(employeeId, date, user.role);
    return {
      message: 'Work schedule deleted successfully',
      data,
    };
  }
}
