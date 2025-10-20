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
import { ServiceDetailDTO } from './dto/service-detail.dto';

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
          ServicePart: {
            include: {
              part: true,
            },
          },
        },
        orderBy: { [query.sortBy ?? 'createdAt']: query.orderBy ?? 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.service.count({ where }),
    ]);

    const mappedData = data.map(service => ({
      ...service,

      parts: service.ServicePart.map(sp => sp.part).filter(
        part => part.status === 'AVAILABLE' || part.status === 'OUT_OF_STOCK'
      ),
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
      status: ServiceStatus.ACTIVE,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [query.sortBy ?? 'createdAt']: query.orderBy ?? 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: plainToInstance(ServiceDto, data, {
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
              quantity: 1,
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

  async getServiceById(id: string): Promise<ServiceDto> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        ServicePart: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const filteredParts = service.ServicePart.map(sp => sp.part).filter(
      part => part.status === 'AVAILABLE' || part.status === 'OUT_OF_STOCK'
    );

    return plainToInstance(
      ServiceDto,
      {
        ...service,
        parts: filteredParts,
        serviceParts: undefined,
      },
      { excludeExtraneousValues: true }
    );
  }

  async getServiceByNameForCustomer(name: string): Promise<ServiceDetailDTO[]> {
    const services = await this.prisma.service.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
        status: ServiceStatus.ACTIVE,
      },
      include: { ServicePart: { include: { part: true } } },
      orderBy: { createdAt: 'asc' },
    });

    if (!services.length) {
      throw new NotFoundException(`No active services found with name containing "${name}"`);
    }

    const mappedData = services.map(service => ({
      ...service,
      parts: service.ServicePart.map(sp => ({
        id: sp.part.id,
        name: sp.part.name,
        quantity: sp.quantity,
        price: sp.part.price,
      })),
    }));

    return plainToInstance(ServiceDetailDTO, mappedData, {
      excludeExtraneousValues: true,
    });
  }

  async getServiceByNameForAdmin(name: string): Promise<ServiceDto[]> {
    const services = await this.prisma.service.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
      },
      include: { ServicePart: { include: { part: true } } },
    });

    if (!services.length) {
      throw new NotFoundException(`No services found with name containing ${name}`);
    }

    const mappedData = services.map(service => ({
      ...service,
      parts: service.ServicePart.map(sp => sp.part).filter(
        part => part.status === 'AVAILABLE' || part.status === 'OUT_OF_STOCK'
      ),
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

    const filteredParts = updatedService.ServicePart.map(sp => sp.part).filter(
      part => part.status === 'AVAILABLE' || part.status === 'OUT_OF_STOCK'
    );

    return plainToInstance(
      ServiceDto,
      { ...updatedService, parts: filteredParts },
      { excludeExtraneousValues: true }
    );
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
