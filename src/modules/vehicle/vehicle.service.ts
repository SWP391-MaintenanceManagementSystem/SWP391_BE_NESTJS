import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import CreateVehicleModelDTO from './dto/create-vehicle-model.dto';
import { CreateVehicleDTO } from './dto/create-vehicle.dto';
import { VehicleDTO } from './dto/vehicle.dto';
import { SuggestVehicleDTO } from './dto/suggest-vehicle.dto';
import { VehicleQueryDTO } from 'src/modules/vehicle/dto/vehicle-query.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { Prisma } from '@prisma/client';
import { UpdateVehicleDTO } from './dto/update-vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(private readonly prismaService: PrismaService) { }

  async createVehicleModel(newModel: CreateVehicleModelDTO) {
    const vehicleModel = await this.prismaService.vehicleModel.create({
      data: newModel,
    });
    return vehicleModel;
  }

  async createVehicleBrand(name: string) {
    const vehicleBrand = await this.prismaService.brand.create({
      data: { name },
    });
    return vehicleBrand;
  }

  async getAllVehicleBrands() {
    const brands = await this.prismaService.brand.findMany();
    return brands;
  }

  async getAllVehicleModels() {
    const models = await this.prismaService.vehicleModel.findMany({
      include: { brand: true },
    });
    return models;
  }

  async getModelsByBrand(brandId: number) {
    const models = await this.prismaService.vehicleModel.findMany({
      where: { brandId },
    });
    return models;
  }

  async createVehicle(newVehicle: CreateVehicleDTO, customerId: string): Promise<VehicleDTO> {
    const errors: Record<string, string> = {};
    const vinExists = await this.prismaService.vehicle.findUnique({
      where: {
        vin: newVehicle.vin,
        status: 'ACTIVE',
        deletedAt: null
      },
    });
    if (vinExists) {
      errors['vin'] = 'VIN already exists';
    }

    const plateExists = await this.prismaService.vehicle.findUnique({
      where: { licensePlate: newVehicle.licensePlate },
    });
    if (plateExists) {
      errors['licensePlate'] = 'License plate already exists';
    }

    const modelExists = await this.prismaService.vehicleModel.findUnique({
      where: { id: newVehicle.modelId },
    });
    if (!modelExists) {
      errors['modelId'] = 'Vehicle model does not exist';
    }
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ errors });
    }

    const vehicle = await this.prismaService.vehicle.create({
      data: {
        ...newVehicle,
        customerId,
      },
      include: { vehicleModel: { include: { brand: true } } },
    });
    return {
      id: vehicle.id,
      vin: vehicle.vin,
      model: vehicle.vehicleModel.name,
      brand: vehicle.vehicleModel.brand.name,
      licensePlate: vehicle.licensePlate,
      customerId: vehicle.customerId,
      status: vehicle.status,
      lastService: vehicle.lastService,
      deletedAt: vehicle.deletedAt,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }

  async updateVehicle(vehicleId: string, updatedVehicle: UpdateVehicleDTO): Promise<VehicleDTO> {
    const errors: Record<string, string> = {};

    const existingVehicle = await this.prismaService.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!existingVehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const vinExists = await this.prismaService.vehicle.findFirst({
      where: {
        AND: [
          { vin: updatedVehicle.vin },
          { status: 'ACTIVE' },
          { deletedAt: null }
        ],

        NOT: { id: vehicleId },
      },
    })
    if (vinExists) {
      errors['vin'] = 'VIN already exists';
    }

    const plateExists = await this.prismaService.vehicle.findFirst({
      where: {
        AND: [
          { licensePlate: updatedVehicle.licensePlate },
          { status: 'ACTIVE' },
          { deletedAt: null }
        ],
        NOT: { id: vehicleId },
      },
    });
    if (plateExists) {
      errors['licensePlate'] = 'License plate already exists';
    }


    const modelExists = await this.prismaService.vehicleModel.findUnique({
      where: { id: updatedVehicle.modelId },
    });
    if (updatedVehicle.modelId && !modelExists) {
      errors['modelId'] = 'Vehicle model does not exist';
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ errors });
    }

    const vehicle = await this.prismaService.vehicle.update({
      where: { id: vehicleId },
      data: updatedVehicle,
      include: { vehicleModel: { include: { brand: true } } },
    });

    return {
      id: vehicle.id,
      vin: vehicle.vin,
      model: vehicle.vehicleModel.name,
      brand: vehicle.vehicleModel.brand.name,
      licensePlate: vehicle.licensePlate,
      customerId: vehicle.customerId,
      status: vehicle.status,
      lastService: vehicle.lastService,
      deletedAt: vehicle.deletedAt,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }

  async deleteVehicle(vehicleId: string): Promise<VehicleDTO> {
    const exists = await this.prismaService.vehicle.findUnique({ where: { id: vehicleId } });
    if (!exists) {
      throw new NotFoundException('Vehicle not found');
    }

    const vehicle = await this.prismaService.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'INACTIVE', deletedAt: new Date() },
      include: { vehicleModel: { include: { brand: true } } },
    });
    return {
      id: vehicle.id,
      vin: vehicle.vin,
      model: vehicle.vehicleModel.name,
      brand: vehicle.vehicleModel.brand.name,
      licensePlate: vehicle.licensePlate,
      customerId: vehicle.customerId,
      status: vehicle.status,
      lastService: vehicle.lastService,
      deletedAt: vehicle.deletedAt,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }

  async suggestVehicles(query: string, accountId: string): Promise<SuggestVehicleDTO[]> {
    if (!query || query.trim() === '' || query.length < 2) {
      return [];
    }
    const vehicles = await this.prismaService.vehicle.findMany({
      where: {
        customerId: accountId,
        AND: [
          {
            OR: [
              { licensePlate: { contains: query, mode: 'insensitive' } },
              { vin: { contains: query, mode: 'insensitive' } },
              { vehicleModel: { name: { contains: query, mode: 'insensitive' } } },
              { vehicleModel: { brand: { name: { contains: query, mode: 'insensitive' } } } },
            ],
          },
          { status: 'ACTIVE' },
        ],
      },
      include: { vehicleModel: { include: { brand: true } } },
      take: 10,
    });

    return vehicles.map(v => ({
      id: v.id,
      label: v.licensePlate,
      subLabel: `${v.vehicleModel.brand.name} ${v.vehicleModel.name} (${v.vin.slice(-6)})`,
    }));
  }

  async getVehicleById(vehicleId: string): Promise<VehicleDTO | null> {
    const vehicle = await this.prismaService.vehicle.findUnique({
      where: { id: vehicleId },
      include: { vehicleModel: { include: { brand: true } } },
    });
    if (!vehicle) {
      return null;
    }
    return {
      id: vehicle.id,
      vin: vehicle.vin,
      model: vehicle.vehicleModel.name,
      brand: vehicle.vehicleModel.brand.name,
      licensePlate: vehicle.licensePlate,
      customerId: vehicle.customerId,
      lastService: vehicle.lastService,
      deletedAt: vehicle.deletedAt,
      status: vehicle.status,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }

  async getVehiclesByCustomer(customerId: string): Promise<VehicleDTO[]> {
    const vehicles = await this.prismaService.vehicle.findMany({
      where: { customerId, status: 'ACTIVE' },
      include: { vehicleModel: { include: { brand: true } } },
    });
    return vehicles.map(vehicle => ({
      id: vehicle.id,
      vin: vehicle.vin,
      model: vehicle.vehicleModel.name,
      brand: vehicle.vehicleModel.brand.name,
      licensePlate: vehicle.licensePlate,
      customerId: vehicle.customerId,
      status: vehicle.status,
      lastService: vehicle.lastService,
      deletedAt: vehicle.deletedAt,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    }));
  }

  async getVehicles(filter: VehicleQueryDTO): Promise<PaginationResponse<VehicleDTO>> {
    let { page = 1, pageSize = 10 } = filter;
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 10;

    const where: Prisma.VehicleWhereInput = {
      status: filter.status,
      modelId: filter.modelId,
      vin: filter.vin ? { contains: filter.vin, mode: 'insensitive' } : undefined,
      licensePlate: filter.licensePlate
        ? { contains: filter.licensePlate, mode: 'insensitive' }
        : undefined,
      vehicleModel: filter.brandId ? { brandId: filter.brandId } : undefined,
    };

    const [vehicles, total] = await this.prismaService.$transaction([
      this.prismaService.vehicle.findMany({
        where,
        include: {
          vehicleModel: {
            include: { brand: true },
          },
        },
        skip: pageSize * (page - 1),
        take: pageSize,
      }),
      this.prismaService.vehicle.count({ where }),
    ]);

    const data: VehicleDTO[] = vehicles.map(vehicle => ({
      id: vehicle.id,
      vin: vehicle.vin,
      model: vehicle.vehicleModel.name,
      brand: vehicle.vehicleModel.brand.name,
      licensePlate: vehicle.licensePlate,
      customerId: vehicle.customerId,
      status: vehicle.status,
      lastService: vehicle.lastService,
      deletedAt: vehicle.deletedAt,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    }));

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
