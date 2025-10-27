import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { VehicleHandoverService } from './vehiclehandover.service';
import { CreateVehicleHandoverDTO } from './dto/create-vehiclehandover.dto';
import { UpdateVehicleHandoverDTO } from './dto/update-vehiclehandover.dto';
import { VehicleHandoverQueryDTO } from './dto/vehiclehandover-query.dto';
import { VehicleHandoverDTO } from './dto/vehiclehandover.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JWT_Payload } from 'src/common/types';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { AccountRole } from '@prisma/client';
import { Roles } from 'src/common/decorator/role.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from 'src/common/guard/role.guard';

@ApiTags('Vehicle Handover')
@ApiBearerAuth('jwt-auth')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('api/vehicle-handovers')
export class VehicleHandoverController {
  constructor(private readonly vehicleHandoverService: VehicleHandoverService) {}

  @Post()
  @Roles(AccountRole.STAFF)
  async create(
    @Body() createDto: CreateVehicleHandoverDTO,
    @CurrentUser() user: JWT_Payload
  ): Promise<{ data: VehicleHandoverDTO; message: string }> {
    const staffAccountId = user.sub;
    return {
      data: await this.vehicleHandoverService.create(createDto, staffAccountId),
      message: 'Vehicle handover created successfully. Booking status updated to CHECKED_IN.',
    };
  }

  @Get()
  @Roles(AccountRole.ADMIN, AccountRole.STAFF)
  @ApiOperation({ summary: 'Get all vehicle handovers - Admin & Staff' })
  async getAll(@Query() query: VehicleHandoverQueryDTO): Promise<{
    data: VehicleHandoverDTO[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    message: string;
  }> {
    const result = await this.vehicleHandoverService.getVehicleHandovers(query);
    return { ...result, message: 'Vehicle handovers retrieved successfully' };
  }

  @Get('booking/:bookingId')
  @Roles(AccountRole.ADMIN, AccountRole.STAFF, AccountRole.CUSTOMER)
  @ApiOperation({ summary: 'Get vehicle handover by booking ID - ADMIN, STAFF, CUSTOMER' })
  async getByBookingId(
    @Param('bookingId', ParseUUIDPipe) bookingId: string
  ): Promise<{ data: VehicleHandoverDTO | null; message: string }> {
    const data = await this.vehicleHandoverService.findByBookingId(bookingId);
    return {
      data,
      message: data
        ? 'Vehicle handover retrieved successfully'
        : 'No handover found for this booking',
    };
  }

  @Get(':id')
  @Roles(AccountRole.ADMIN, AccountRole.STAFF)
  @ApiOperation({ summary: 'Get vehicle handover by Admin and Staff' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ data: VehicleHandoverDTO; message: string }> {
    const data = await this.vehicleHandoverService.getVehicleHandoverById(id);
    return { data, message: 'Vehicle handover retrieved successfully' };
  }

  @Patch(':id')
  @Roles(AccountRole.STAFF)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateVehicleHandoverDTO
  ): Promise<{ data: VehicleHandoverDTO; message: string }> {
    const data = await this.vehicleHandoverService.updateVehicleHandover(id, updateDto);
    return { data, message: 'Vehicle handover updated successfully' };
  }

  @Delete(':id')
  @Roles(AccountRole.STAFF, AccountRole.ADMIN)
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.vehicleHandoverService.deleteVehicleHandover(id);
    return { message: 'Vehicle handover deleted successfully' };
  }
}
