import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServicePartDto } from './dto/create-service-part.dto';
import { UpdateServicePartDto } from './dto/update-service-part.dto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import ServicePartDto from './dto/service-part.dto';
import { plainToInstance } from 'class-transformer';
import { NotFoundError } from 'rxjs';

@Injectable()
export class ServicePartService {
  constructor(private readonly prisma: PrismaService) {}

  async createServicePart(createServicePartDto: CreateServicePartDto): Promise<ServicePartDto> {
    const servicePart = await this.prisma.servicePart.create({
      data: createServicePartDto,
      include: { service: true, part: true },
    });
    return plainToInstance(ServicePartDto, servicePart, { excludeExtraneousValues: true });
  }

  async getAllServiceParts(): Promise<ServicePartDto[]> {
    const serviceParts = await this.prisma.servicePart.findMany({
      include: { service: true, part: true },
      orderBy: { id: 'asc' },
    });
    return plainToInstance(ServicePartDto, serviceParts, { excludeExtraneousValues: true });
  }

  async getServicePartById(id: string): Promise<ServicePartDto | null> {
    const servicePart = await this.prisma.servicePart.findUnique({
      where: { id },
      include: { service: true, part: true },
    });
    if (!servicePart) {
      throw new NotFoundException(`ServicePart with ID ${id} not found`);
    }
    return plainToInstance(ServicePartDto, servicePart, { excludeExtraneousValues: true });
  }

  async updateServicePart(
    id: string,
    updateServicePartDto: UpdateServicePartDto
  ): Promise<ServicePartDto> {
    const existingServicePart = await this.prisma.servicePart.findUnique({ where: { id } });
    if (!existingServicePart) {
      throw new NotFoundException(`ServicePart with ID ${id} not found`);
    }
    const updatedServicePart = await this.prisma.servicePart.update({
      where: { id },
      data: updateServicePartDto,
      include: { service: true, part: true },
    });
    return plainToInstance(ServicePartDto, updatedServicePart, { excludeExtraneousValues: true });
  }

  async deleteServicePart(id: string): Promise<ServicePartDto> {
    const existingServicePart = await this.prisma.servicePart.findUnique({ where: { id } });
    if (!existingServicePart) {
      throw new NotFoundException(`ServicePart with ID ${id} not found`);
    }
    const deletedServicePart = await this.prisma.servicePart.delete({
      where: { id },
      include: { service: true, part: true },
    });
    return plainToInstance(ServicePartDto, deletedServicePart, { excludeExtraneousValues: true });
  }
}
