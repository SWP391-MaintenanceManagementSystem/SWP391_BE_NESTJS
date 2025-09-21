import { Body, Controller, Get, Param, Post, UseGuards, Req, Delete, Patch, Query } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { CreateVehicleDTO } from './dto/create-vehicle.dto';
import { JWT_Payload } from 'src/common/types';
import { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Serialize } from 'src/common/interceptor/serialize.interceptor';
import { UpdateVehicleDTO } from './dto/update-vehicle.dto';
@UseGuards(JwtAuthGuard)
@Controller('vehicle')
@ApiBearerAuth('jwt-auth')
@ApiTags('Vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) { }


  @Get('brands')
  async getAllVehicleBrands() {
    return this.vehicleService.getAllVehicleBrands();
  }

  @Get('models')
  async getAllVehicleModels() {
    return this.vehicleService.getAllVehicleModels();
  }

  @Get('models/:brandId')
  async getModelsByBrand(@Param('brandId') brandId: number) {
    return this.vehicleService.getModelsByBrand(brandId);
  }


  @Roles(AccountRole.CUSTOMER, AccountRole.ADMIN)
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search query for vehicle brand, vin, model, or license plate' })
  @Get('/suggest')
  async suggestVehicles(@Query('q') query: string) {
    return this.vehicleService.suggestVehicles(query);
  }

  @Roles(AccountRole.CUSTOMER)
  @Post()
  async createVehicle(@Body() newVehicle: CreateVehicleDTO, @Req() req: Request) {
    const user = req.user as JWT_Payload;
    const vehicle = await this.vehicleService.createVehicle(newVehicle, user.sub);
    return {
      message: 'Vehicle created successfully',
      data: vehicle
    };
  }

  @Roles(AccountRole.CUSTOMER)
  @Patch(':vehicleId')
  async updateVehicle(@Param('vehicleId') vehicleId: string, @Body() body: UpdateVehicleDTO) {
    const vehicle = await this.vehicleService.updateVehicle(vehicleId, body);
    return {
      message: 'Vehicle updated successfully',
      vehicle
    };
  }

  @Roles(AccountRole.CUSTOMER, AccountRole.ADMIN)
  @Delete(':vehicleId')
  async deleteVehicle(@Param('vehicleId') vehicleId: string) {
    const vehicle = await this.vehicleService.deleteVehicle(vehicleId);
    return {
      message: 'Vehicle deleted successfully',
      data: vehicle
    };
  }

}
