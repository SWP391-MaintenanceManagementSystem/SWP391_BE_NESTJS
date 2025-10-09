import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { CreateVehicleDTO } from './dto/create-vehicle.dto';
import { JWT_Payload } from 'src/common/types';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VehicleQueryDTO } from './dto/vehicle-query.dto';
import { UpdateVehicleDTO } from './dto/update-vehicle.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/vehicles')
@ApiBearerAuth('jwt-auth')
@ApiTags('Vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get('brands')
  async getAllVehicleBrands() {
    const brands = await this.vehicleService.getAllVehicleBrands();
    return {
      message: 'Vehicle brands retrieved successfully',
      data: brands,
    };
  }

  @Get('models')
  async getAllVehicleModels() {
    const models = await this.vehicleService.getAllVehicleModels();
    return {
      message: 'Vehicle models retrieved successfully',
      data: models,
    };
  }

  @Get('brands/:brandId/models')
  async getModelsByBrand(@Param('brandId') brandId: number) {
    const models = await this.vehicleService.getModelsByBrand(brandId);
    return {
      message: 'Vehicle models by brand retrieved successfully',
      data: models,
    };
  }

  // @Roles(AccountRole.CUSTOMER)
  // @Get()
  // async getMyVehicles(@Req() req: Request) {
  //   const user = req.user as JWT_Payload;
  //   const vehicles = await this.vehicleService.getVehiclesByCustomer(user.sub);
  //   return {
  //     message: 'Vehicles retrieved successfully',
  //     data: vehicles,
  //   };
  // }

  @Roles(AccountRole.ADMIN)
  @Get()
  async getAllVehicles(@Query() query: VehicleQueryDTO) {
    const { data, page, pageSize, total, totalPages } =
      await this.vehicleService.getVehicles(query);
    return {
      message: 'Vehicles retrieved successfully',
      data,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  @Roles(AccountRole.ADMIN)
  @Get('/accounts/:accountId')
  async getVehiclesByAccount(@Param('accountId') accountId: string) {
    const vehicles = await this.vehicleService.getVehiclesByCustomer(accountId, true);
    return {
      message: 'Vehicles retrieved successfully',
      data: vehicles,
    };
  }

  @Roles(AccountRole.CUSTOMER)
  @Get('/actions/suggest')
  async suggestVehicles(@Query('q') q: string, @Req() req: Request) {
    const user = req.user as JWT_Payload;
    const data = await this.vehicleService.suggestVehicles(q, user.sub);
    return {
      message: 'Vehicle suggestions retrieved successfully',
      data,
    };
  }

  @Get('/:vehicleId')
  async getVehicleById(@Param('vehicleId') vehicleId: string) {
    const vehicle = await this.vehicleService.getVehicleById(vehicleId);
    return {
      message: 'Vehicle retrieved successfully',
      data: vehicle,
    };
  }

  @Roles(AccountRole.CUSTOMER)
  @Post()
  async createVehicle(@Body() newVehicle: CreateVehicleDTO, @Req() req: Request) {
    const user = req.user as JWT_Payload;
    const vehicle = await this.vehicleService.createVehicle(newVehicle, user.sub);
    return {
      message: 'Vehicle created successfully',
      data: vehicle,
    };
  }

  @Roles(AccountRole.ADMIN)
  @Patch('/:vehicleId')
  async updateVehicle(@Param('vehicleId') vehicleId: string, @Body() body: UpdateVehicleDTO) {
    const vehicle = await this.vehicleService.updateVehicle(vehicleId, body);
    return {
      message: 'Vehicle updated successfully',
      data: vehicle,
    };
  }

  @Roles(AccountRole.CUSTOMER, AccountRole.ADMIN)
  @Delete('/:vehicleId')
  async deleteVehicle(@Param('vehicleId') vehicleId: string) {
    const vehicle = await this.vehicleService.deleteVehicle(vehicleId);
    return {
      message: 'Vehicle deleted successfully',
      data: vehicle,
    };
  }
}
