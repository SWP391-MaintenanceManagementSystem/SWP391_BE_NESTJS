import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Service, ServiceStatus } from '@prisma/client';
import { ServiceQueryDTO } from './dto/service-query.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { ServiceDto } from './dto/service.dto';
import { plainToInstance } from 'class-transformer';
import { ServiceQueryCustomerDTO } from './dto/service-query-customer.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}


  async findAllForAdmin(query: ServiceQueryDTO): Promise<PaginationResponse<ServiceDto>> {
    const { page = 1, pageSize = 10, status } = query;

    const where: Prisma.ServiceWhereInput = {
      name: query.name ? { contains: query.name, mode: 'insensitive' } : undefined,
      price:
        query.minPrice || query.maxPrice
          ? {
              gte: query.minPrice ?? undefined,
              lte: query.maxPrice ?? undefined,
            }
          : undefined,
      status: status ?? ServiceStatus.ACTIVE,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        include: {
          ServicePart: { include: { part: true } },
        },
        orderBy: { [query.sortBy ?? 'createdAt']: query.orderBy ?? 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.service.count({ where }),
    ]);

    const mappedData = data.map(service => ({
      ...service,
      parts: service.ServicePart.map(sp => sp.part),
      serviceParts: undefined,
    }));

    return {
      data: plainToInstance(ServiceDto, mappedData, {
        excludeExtraneousValues: true,
      }),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findAllForCustomer(
    query: ServiceQueryCustomerDTO
  ): Promise<PaginationResponse<ServiceDto>> {
    const { page = 1, pageSize = 10 } = query;

    const where: Prisma.ServiceWhereInput = {
      name: query.name ? { contains: query.name, mode: 'insensitive' } : undefined,
      price:
        query.minPrice || query.maxPrice
          ? {
              gte: query.minPrice ?? undefined,
              lte: query.maxPrice ?? undefined,
            }
          : undefined,
      status: 'ACTIVE',
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        include: {
          ServicePart: { include: { part: true } },
        },
        orderBy: { [query.sortBy ?? 'createdAt']: query.orderBy ?? 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.service.count({ where }),
    ]);

    const mappedData = data.map(service => ({
      ...service,
      parts: service.ServicePart.map(sp => sp.part),
      serviceParts: undefined,
    }));

    return {
      data: plainToInstance(ServiceDto, mappedData, {
        excludeExtraneousValues: true,
      }),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async create(createServiceDto: CreateServiceDto): Promise<ServiceDto> {
    const { name, description, price, partIds } = createServiceDto;

    // Tạo service trước, rồi tạo ServicePart
    const newService = await this.prisma.service.create({
      data: {
        name,
        description,
        price,
        status: 'ACTIVE',
        ServicePart: {
          create:
            partIds?.map(partId => ({
              partId,
              quantity: 1, // default quantity, bạn có thể cho nhập từ DTO
            })) || [],
        },
      },
      include: {
        ServicePart: {
          include: { part: true },
        },
      },
    });

    return plainToInstance(ServiceDto, newService, { excludeExtraneousValues: true });
  }

  async getServiceByNameForCustomer(name: string): Promise<ServiceDto[]> {
    const services = await this.prisma.service.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
        status: ServiceStatus.ACTIVE,
      },
      include: { ServicePart: { include: { part: true } } },
    });

    if (!services.length) {
      throw new NotFoundException(`No active services found with name containing "${name}"`);
    }

    // Map lại giống findAll
    const mappedData = services.map(service => ({
      ...service,
      parts: service.ServicePart.map(sp => sp.part),
      serviceParts: undefined,
    }));

    return plainToInstance(ServiceDto, mappedData, { excludeExtraneousValues: true });
  }

  async getServiceByNameForAdmin(name: string): Promise<ServiceDto[]> {
    const services = await this.prisma.service.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
      include: { ServicePart: { include: { part: true } } },
    });

    if (!services.length) {
      throw new NotFoundException(`No services found with name containing "${name}"`);
    }

    const mappedData = services.map(service => ({
      ...service,
      parts: service.ServicePart.map(sp => sp.part),
      serviceParts: undefined,
    }));

    return plainToInstance(ServiceDto, mappedData, { excludeExtraneousValues: true });
  }

  async updateService(id: string, updateServiceDto: UpdateServiceDto): Promise<ServiceDto> {
    const existingService = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!existingService) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    const updatedService = await this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
      include: { ServicePart: { include: { part: true } } },
    });
    return plainToInstance(ServiceDto, updatedService, { excludeExtraneousValues: true });
  }

  async deleteService(id: string) {
    const existingService = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!existingService) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return this.prisma.service.update({
      where: { id },
      data: { status: ServiceStatus.INACTIVE },
    });
  }
}
