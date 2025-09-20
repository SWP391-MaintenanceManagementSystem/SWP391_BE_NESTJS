import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import CreateVehicleModelDTO from './dto/create-vehicle-model.dto';
import { CreateVehicleDTO } from './dto/create-vehicle.dto';
import { UpdateVehicleDTO } from './dto/update-vehicle.dto';
import { Vehicle } from '@prisma/client';
import { VehicleDTO } from './dto/vehicle.dto';

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
        console.log("🚀 ~ VehicleService ~ getAllVehicleModels ~ models:", models)
        return models;
    }

    async getModelsByBrand(brandId: number) {
        const models = await this.prismaService.vehicleModel.findMany({
            where: { brandId },
            include: { brand: true }
        });
        return models;
    }

    async createVehicle(newVehicle: CreateVehicleDTO, customerId: string) {
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


    async updateVehicle(vehicleId: string, updatedVehicle: UpdateVehicleDTO) {
        const errors: Record<string, string> = {};
        const plateExists = await this.prismaService.vehicle.findUnique({
            where: { licensePlate: updatedVehicle.licensePlate }
        });
        if (plateExists) {
            errors['licensePlate'] = 'License plate already exists';
        }

        if (plateExists?.id !== vehicleId) {
            errors['id'] = 'Vehicle ID does not match';
        }

        if (Object.keys(errors).length > 0) {
            throw new BadRequestException({ errors });
        }

        const vehicle = await this.prismaService.vehicle.update({
            where: { id: vehicleId },
            data: updatedVehicle,
            include: { vehicleModel: { include: { brand: true } } }
        });
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

    async deleteVehicle(vehicleId: string) {
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

}
