import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePackageDetailDto } from './dto/create-package-detail.dto';
import { UpdatePackageDetailDto } from './dto/update-package-detail.dto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PackageDetailDto } from './dto/package-detail.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PackageDetailService {
  constructor(private readonly prisma: PrismaService) {}

  async createPackage(createPackageDetailDto: CreatePackageDetailDto): Promise<PackageDetailDto> {
    const packageDetail = await this.prisma.packageDetail.create({
      data: {
        packageId: createPackageDetailDto.packageId,
        serviceId: createPackageDetailDto.serviceId,
        quantity: createPackageDetailDto.quantity,
      },
      include: {service: true
      },
    });
      return plainToInstance(PackageDetailDto, packageDetail, { excludeExtraneousValues: true });
  }

  async getAllPackageDetail(): Promise<PackageDetailDto[]> {
    const packageDetails = await this.prisma.packageDetail.findMany({
      include: { service: true },
    });
    return plainToInstance(PackageDetailDto, packageDetails, { excludeExtraneousValues: true });
  }

  async getPackageDetailById(packageId: string, serviceId: string): Promise<PackageDetailDto | null> {
    const existingPackageDetail = await this.prisma.packageDetail.findUnique({
      where: { packageId_serviceId: { packageId, serviceId } },
      include: { service: true },
    });
    if (!existingPackageDetail) {
      throw new NotFoundException('PackageDetail not found');
    }
    return plainToInstance(PackageDetailDto, existingPackageDetail, { excludeExtraneousValues: true });
  }

  async updatePackageDetail(packageId: string, serviceId: string, updatePackageDetailDto: UpdatePackageDetailDto): Promise<PackageDetailDto> {
    const existingPackageDetail = await this.prisma.packageDetail.findUnique({
      where: { packageId_serviceId: { packageId, serviceId } },
    });
    if (!existingPackageDetail) {
      throw new NotFoundException('PackageDetail not found');
    }
    const updatedPackageDetail = await this.prisma.packageDetail.update({
      where: { packageId_serviceId: { packageId, serviceId } },
      data: {
        quantity: updatePackageDetailDto.quantity ?? existingPackageDetail.quantity,
      },
      include: { service: true },
    });
    return plainToInstance(PackageDetailDto, updatedPackageDetail, { excludeExtraneousValues: true });

  }

  async deletePackageDetail(packageId: string, serviceId: string): Promise<string> {
    const existing = await this.prisma.packageDetail.findUnique({
      where: { packageId_serviceId: { packageId, serviceId } },
    });
    if (!existing) {
      throw new NotFoundException(`PackageDetail not found`);
    }

    await this.prisma.packageDetail.delete({
      where: { packageId_serviceId: { packageId, serviceId } },
    });

    return `PackageDetail has been deleted`;
  }
}
