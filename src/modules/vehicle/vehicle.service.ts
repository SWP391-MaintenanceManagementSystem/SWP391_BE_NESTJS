import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import CreateVehicleModelDTO from './dto/create-vehicle-model.dto';
import { CreateVehicleDTO } from './dto/create-vehicle.dto';
import { UpdateVehicleDTO } from './dto/update-vehicle.dto';
import { Vehicle } from '@prisma/client';
import { VehicleDTO } from './dto/vehicle.dto';
import { SuggestVehicleDTO } from './dto/suggest-vehicle.dto';

@Injectable()
export class VehicleService {
    constructor(private readonly prismaService: PrismaService) { }


    async createVehicleModel(newModel: CreateVehicleModelDTO) {
        const vehicleModel = await this.prismaService.vehicleModel.create({
            data: newModel
        })
        return vehicleModel;
    }

    async createVehicleBrand(name: string) {
        const vehicleBrand = await this.prismaService.brand.create({
            data: { name }
        })
        return vehicleBrand;
    }


    async getAllVehicleBrands() {
        const brands = await this.prismaService.brand.findMany();
        return brands;
    }


    async getAllVehicleModels() {
        const models = await this.prismaService.vehicleModel.findMany({
            include: { brand: true }
        });
        return models;
    }

    async getModelsByBrand(brandId: number) {
        const models = await this.prismaService.vehicleModel.findMany({
            where: { brandId },
            include: { brand: true }
        });
        return models;
    }

    async createVehicle(newVehicle: CreateVehicleDTO, customerId: string): Promise<VehicleDTO> {
        const errors: Record<string, string> = {};
        const vinExists = await this.prismaService.vehicle.findUnique({
            where: { vin: newVehicle.vin }
        });
        if (vinExists) {
            errors['vin'] = 'VIN already exists';
        }

        const plateExists = await this.prismaService.vehicle.findUnique({
            where: { licensePlate: newVehicle.licensePlate }
        });
        if (plateExists) {
            errors['licensePlate'] = 'License plate already exists';
        }

        if (Object.keys(errors).length > 0) {
            throw new BadRequestException({ errors });
        }

        const vehicle = await this.prismaService.vehicle.create({
            data: {
                ...newVehicle,
                customerId
            },
            include: { vehicleModel: { include: { brand: true } } }
        })
        const vehicleDTO: VehicleDTO = {
            id: vehicle.id,
            vin: vehicle.vin,
            model: vehicle.vehicleModel.name,
            brand: vehicle.vehicleModel.brand.name,
            licensePlate: vehicle.licensePlate,
            customerId: vehicle.customerId,
            status: vehicle.status,
            createdAt: vehicle.createdAt,
            updatedAt: vehicle.updatedAt
        }

        return vehicleDTO;
    }


    async updateVehicle(vehicleId: string, updatedVehicle: UpdateVehicleDTO): Promise<VehicleDTO> {
        const errors: Record<string, string> = {};

        const existingVehicle = await this.prismaService.vehicle.findUnique({
            where: { id: vehicleId },
        });
        if (!existingVehicle) {
            errors['id'] = 'Vehicle not found';
        }

        const plateExists = await this.prismaService.vehicle.findFirst({
            where: {
                licensePlate: updatedVehicle.licensePlate,
                NOT: { id: vehicleId },
            },
        });
        if (plateExists) {
            errors['licensePlate'] = 'License plate already exists';
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
            createdAt: vehicle.createdAt,
            updatedAt: vehicle.updatedAt,
        };
    }


    async deleteVehicle(vehicleId: string): Promise<VehicleDTO> {
        const errors: Record<string, string> = {};
        const exists = await this.prismaService.vehicle.findUnique({ where: { id: vehicleId } });
        if (!exists) {
            errors['id'] = 'Vehicle ID does not exist';
        }

        if (Object.keys(errors).length > 0) {
            throw new BadRequestException({ errors });
        }

        const vehicle = await this.prismaService.vehicle.update({
            where: { id: vehicleId },
            data: { status: 'INACTIVE' },
            include: { vehicleModel: { include: { brand: true } } }
        });
        return {
            id: vehicle.id,
            vin: vehicle.vin,
            model: vehicle.vehicleModel.name,
            brand: vehicle.vehicleModel.brand.name,
            licensePlate: vehicle.licensePlate,
            customerId: vehicle.customerId,
            status: vehicle.status,
            createdAt: vehicle.createdAt,
            updatedAt: vehicle.updatedAt
        }

    }


    async suggestVehicles(query: string): Promise<SuggestVehicleDTO[]> {
        if (!query || query.trim() === '' || query.length < 2) {
            return [];
        }
        const vehicles = await this.prismaService.vehicle.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { licensePlate: { contains: query, mode: 'insensitive' } },
                            { vin: { contains: query, mode: 'insensitive' } },
                            { vehicleModel: { name: { contains: query, mode: 'insensitive' } } },
                            { vehicleModel: { brand: { name: { contains: query, mode: 'insensitive' } } } }
                        ]
                    },
                    { status: 'ACTIVE' }
                ]
            },
            include: { vehicleModel: { include: { brand: true } } },
            take: 10
        })

        return vehicles.map(v => ({
            id: v.id,
            label: v.licensePlate,
            subLabel: `${v.vehicleModel.brand.name} ${v.vehicleModel.name} (${v.vin.slice(-6)})`,
        }));

    }


    async getVehicleById(vehicleId: string): Promise<VehicleDTO | null> {
        const vehicle = await this.prismaService.vehicle.findUnique({
            where: { id: vehicleId },
            include: { vehicleModel: { include: { brand: true } } }
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
            status: vehicle.status,
            createdAt: vehicle.createdAt,
            updatedAt: vehicle.updatedAt
        };
    }

    async getVehiclesByCustomer(customerId: string): Promise<VehicleDTO[]> {
        const vehicles = await this.prismaService.vehicle.findMany({
            where: { customerId, status: 'ACTIVE' },
            include: { vehicleModel: { include: { brand: true } } }
        });
        return vehicles.map(vehicle => ({
            id: vehicle.id,
            vin: vehicle.vin,
            model: vehicle.vehicleModel.name,
            brand: vehicle.vehicleModel.brand.name,
            licensePlate: vehicle.licensePlate,
            customerId: vehicle.customerId,
            status: vehicle.status,
            createdAt: vehicle.createdAt,
            updatedAt: vehicle.updatedAt
        }));
    }

}
