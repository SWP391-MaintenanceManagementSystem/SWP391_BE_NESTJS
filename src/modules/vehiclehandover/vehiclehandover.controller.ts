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
} from '@nestjs/common';
import { VehicleHandoverService } from './vehiclehandover.service';
import { CreateVehicleHandoverDTO } from './dto/create-vehiclehandover.dto';
import { UpdateVehicleHandoverDTO } from './dto/update-vehiclehandover.dto';
import { VehicleHandoverQueryDTO } from './dto/vehiclehandover-query.dto';
import { VehicleHandoverDTO } from './dto/vehiclehandover.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JWT_Payload } from 'src/common/types';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';

@ApiTags('Vehicle Handover')
@ApiBearerAuth('jwt-auth')
@Controller('vehiclehandover')
export class VehicleHandoverController {
  constructor(private readonly vehicleHandoverService: VehicleHandoverService) {}

  @Post()
  async create(
    @Body() createDto: CreateVehicleHandoverDTO,
    @CurrentUser() user: JWT_Payload
  ): Promise<{ data: VehicleHandoverDTO; message: string }> {
    const staffId = user.sub;
    return {
      data: await this.vehicleHandoverService.create(createDto, staffId),
      message: 'Vehicle handover created successfully',
    };
  }

  @Get()
  async getVehicleHandovers(@Query() query: VehicleHandoverQueryDTO): Promise<{
    data: VehicleHandoverDTO[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    message: string;
  }> {
    const result = await this.vehicleHandoverService.getVehicleHandovers(query);
    return { ...result, message: 'Vehicle handovers fetched successfully' };
  }

  @Get(':id')
  async getById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ data: VehicleHandoverDTO; message: string }> {
    const data = await this.vehicleHandoverService.getVehicleHandoverById(id);
    return { data, message: 'Vehicle handover retrieved successfully' };
  }

  @Get('booking/:bookingId')
  async getByBookingId(
    @Param('bookingId', ParseUUIDPipe) bookingId: string
  ): Promise<{ data: VehicleHandoverDTO | null; message: string }> {
    const data = await this.vehicleHandoverService.findByBookingId(bookingId);
    return { data, message: 'Vehicle handover (by booking) retrieved successfully' };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateVehicleHandoverDTO
  ): Promise<{ data: VehicleHandoverDTO; message: string }> {
    const data = await this.vehicleHandoverService.updateVehicleHandover(id, updateDto);
    return { data, message: 'Vehicle handover updated successfully' };
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.vehicleHandoverService.deleteVehicleHandover(id);
    return { message: 'Vehicle handover deleted successfully' };
  }
}
