import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PackageDto } from './dto/package.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PackageService {
  constructor(private readonly prisma: PrismaService) {}

  async createPackage(createPackageDto: CreatePackageDto): Promise<PackageDto> {
    const packageData = await this.prisma.package.create({
      data: createPackageDto,
      include: { packageDetails: { include: { service: true } } },
    });
    return plainToInstance(PackageDto, packageData, { excludeExtraneousValues: true });
  }

  async getAllPackages(): Promise<PackageDto[]> {
    const packages = await this.prisma.package.findMany({
      orderBy: { createdAt: 'asc' },
      include: { packageDetails: { include: { service: true } } },
    });
    return plainToInstance(PackageDto, packages, { excludeExtraneousValues: true });
  }

  async getPackageById(id: string): Promise<PackageDto> {
    const packageData = await this.prisma.package.findUnique({
      where: { id },
      include: { packageDetails: { include: { service: true } } },
    });
    if(!packageData) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }
    return plainToInstance(PackageDto, packageData, { excludeExtraneousValues: true });
  }

  async updatePackage(id: string, updatePackageDto: UpdatePackageDto): Promise<PackageDto> {
    const existingPackage = await this.prisma.package.findUnique({ where: { id } });
    if (!existingPackage) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }
    const updatedPackage = await this.prisma.package.update({
      where: { id },
      data: updatePackageDto,
      include: { packageDetails: { include: { service: true } } },
    });
    return plainToInstance(PackageDto, updatedPackage, { excludeExtraneousValues: true });
  }

  async deletePackage(id: string): Promise<string> {
    const existingPackage = await this.prisma.package.findUnique({ where: { id } });
    if (!existingPackage) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }
    await this.prisma.package.delete({ where: { id } });
    return `Package with ID ${id} has been deleted`;
  }
}
