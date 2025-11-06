import { Body, Controller, Get, Query, Param, Delete, Post, Patch } from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CreateTechnicianDTO } from './dto/create-technician.dto';
import { UpdateTechnicianDTO } from './dto/update-technician.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { EmployeeQueryDTO, EmployeeQueryWithPaginationDTO } from '../dto/employee-query.dto';
import { plainToInstance } from 'class-transformer';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { JWT_Payload } from 'src/common/types';
import { TechnicianBookingQueryDTO } from 'src/modules/booking/dto/technician-booking-query.dto';
import { TechnicianBookingService } from 'src/modules/booking/technician-booking.service';
import { EmitNotification } from 'src/common/decorator/emit-notification.decorator';
import { NotificationService } from 'src/modules/notification/notification.service';
import { NotificationTemplateService } from 'src/modules/notification/notification-template.service';

@ApiTags('Technicians')
@ApiBearerAuth('jwt-auth')
@Controller('api/technicians')
export class TechnicianController {
  constructor(
    private readonly technicianService: TechnicianService,
    private readonly technicianBookingService: TechnicianBookingService
  ) {}

  @Get('/statistics')
  @Roles(AccountRole.ADMIN)
  async getTechnicianStatistics() {
    const { data, total } = await this.technicianService.getTechnicianStatistics();
    return {
      message: 'Get technician statistics successfully',
      data,
      total,
    };
  }

  @Get('/bookings')
  @Roles(AccountRole.TECHNICIAN)
  async getTechnicianBookings(
    @Query() query: TechnicianBookingQueryDTO,
    @CurrentUser() user: JWT_Payload
  ) {
    const { data, page, pageSize, total, totalPages } =
      await this.technicianBookingService.getTechnicianBookings(user.sub, query);
    return {
      data,
      page,
      pageSize,
      total,
      totalPages,
      message: 'Get technician bookings successfully',
    };
  }

  @Patch('bookings/:bookingId/details/complete')
  @ApiBody({ schema: { example: { detailIds: ['d1', 'd2', 'd3'] } } })
  @Roles(AccountRole.TECHNICIAN)
  @EmitNotification(NotificationTemplateService.bookingCompleted())
  async completeMultiple(
    @Param('bookingId') bookingId: string,
    @Body() body: { detailIds: string[] },
    @CurrentUser() user: JWT_Payload
  ) {
    const result = await this.technicianBookingService.markCompleteTasks(
      bookingId,
      user,
      body.detailIds
    );

    return { data: result.data, message: 'Booking details marked as complete successfully' };
  }

  @Patch('bookings/:bookingId/details/start')
  @Roles(AccountRole.TECHNICIAN)
  @EmitNotification(NotificationTemplateService.bookingInProgress())
  async startTasks(@Param('bookingId') bookingId: string, @CurrentUser() user: JWT_Payload) {
    await this.technicianBookingService.markInprogressTasks(bookingId, user);
    return { message: 'Booking details marked as in progress successfully' };
  }

  @Get('/')
  @Roles(AccountRole.ADMIN)
  async getTechnicians(@Query() query: EmployeeQueryWithPaginationDTO) {
    const { data, page, pageSize, total, totalPages } =
      await this.technicianService.getTechnicians(query);
    return {
      message: 'Technicians retrieved successfully',
      data: plainToInstance(AccountWithProfileDTO, data),
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  @Patch('/:id/reset-password')
  @Roles(AccountRole.ADMIN)
  async resetDefaultPassword(@Param('id') id: string) {
    await this.technicianService.resetDefaultPassword(id);
    return { message: `Technician's password reset successfully` };
  }

  @Get('/:id')
  @Roles(AccountRole.ADMIN)
  async getTechnicianById(@Param('id') id: string) {
    const data = await this.technicianService.getTechnicianById(id);
    return { data, message: `Technician with ID retrieved successfully` };
  }

  @Post()
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: CreateTechnicianDTO })
  async createTechnician(@Body() createTechnicianDto: CreateTechnicianDTO) {
    const data = await this.technicianService.createTechnician(createTechnicianDto);
    return { data, message: 'Technician created successfully' };
  }

  @Patch('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: UpdateTechnicianDTO })
  async updateTechnician(
    @Param('id') id: string,
    @Body() updateTechnicianDto: UpdateTechnicianDTO
  ) {
    const data = await this.technicianService.updateTechnician(id, updateTechnicianDto);
    return {
      message: 'Technician updated successfully',
      data: plainToInstance(AccountWithProfileDTO, data),
    };
  }

  @Delete('/:id')
  @Roles(AccountRole.ADMIN)
  async deleteTechnician(@Param('id') id: string) {
    const data = await this.technicianService.deleteTechnician(id);
    return {
      message: `Technician deleted successfully`,
    };
  }
}
