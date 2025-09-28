import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Service } from '@prisma/client';
import { ServiceQueryDTO } from './dto/service-query.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { ServiceDto } from './dto/service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService){}

  async findAll(query: ServiceQueryDTO): Promise<PaginationResponse<ServiceDto>> {
  const { page = 1, pageSize = 10 } = query;

  const where: Prisma.ServiceWhereInput = {
    name: query.name ? { contains: query.name, mode: 'insensitive' } : undefined,
    price: query.minPrice || query.maxPrice ? {
      gte: query.minPrice,
      lte: query.maxPrice,
    } : undefined,
  };

  const [data, total] = await this.prisma.$transaction([
    this.prisma.service.findMany({
      where,
      orderBy: { [query.sortBy ?? 'createdAt']: query.orderBy ?? 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    this.prisma.service.count({ where }),
  ]);

  return {
    data,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    return this.prisma.service.create({
      data: createServiceDto,
    });
  }

  async getServiceByID(id: string): Promise<Service | null> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async updateService(id: string, updateServiceDto: UpdateServiceDto): Promise<ServiceDto> {
    const existingService = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!existingService) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async deleteService(id: string) {
    const existingService = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!existingService) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return this.prisma.service.delete({
      where: { id },
    });
  }
}
