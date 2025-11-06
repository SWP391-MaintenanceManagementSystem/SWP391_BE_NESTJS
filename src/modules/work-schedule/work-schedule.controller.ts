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
import { UpdateWorkScheduleDTO } from './dto/update-work-schedule.dto';
import { CreateWorkScheduleDTO } from './dto/create-work-schedule.dto';
import { EmitNotification } from 'src/common/decorator/emit-notification.decorator';
import { NotificationTemplateService } from '../notification/notification-template.service';

@ApiTags('Work Schedules')
@Controller('api/work-schedules')
@UseGuards(RoleGuard)
@ApiBearerAuth('jwt-auth')
export class WorkScheduleController {
  constructor(private readonly workScheduleService: WorkScheduleService) {}

  @Post()
  @EmitNotification(NotificationTemplateService.workScheduleAssigned())
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: CreateWorkScheduleDTO })
  async createWorkSchedule(@Body() createDto: CreateWorkScheduleDTO, @CurrentUser() user: any) {
    const result = await this.workScheduleService.createWorkSchedule(createDto, user.role);
    return {
      message: 'Work schedules created successfully',
      data: result.data,
      count: result.data.length,
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

  @Get('employee/:employeeId')
  @UseGuards()
  async getWorkSchedulesByEmployeeId(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    const data = await this.workScheduleService.getWorkSchedulesByEmployeeId(employeeId);

    return {
      message: 'Work schedules retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(AccountRole.ADMIN)
  @EmitNotification(NotificationTemplateService.shiftUpdated())
  @ApiBody({ type: UpdateWorkScheduleDTO })
  async updateWorkSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateWorkScheduleDTO,
    @CurrentUser() user: any
  ) {
    const data = await this.workScheduleService.updateWorkSchedule(id, updateDto, user.role);
    return {
      message: 'Work schedule updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(AccountRole.ADMIN)
  @EmitNotification(NotificationTemplateService.shiftCancelled())
  async deleteWorkSchedule(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    const data = await this.workScheduleService.deleteWorkSchedule(id, user.role);
    return {
      message: 'Work schedule deleted successfully',
      data,
    };
  }
}
