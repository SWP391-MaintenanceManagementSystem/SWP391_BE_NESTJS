import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Service, ServiceStatus } from '@prisma/client';
import { ServiceQueryDTO } from './dto/service-query.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { ServiceDto } from './dto/service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService){}

  async findAllForAdmin(query: ServiceQueryDTO): Promise<PaginationResponse<ServiceDto>> {
  const { page = 1, pageSize = 10, status } = query;

  const where: Prisma.ServiceWhereInput = {
    name: query.name ? { contains: query.name, mode: 'insensitive' } : undefined,
    price:
      query.minPrice || query.maxPrice
        ? {
            gte: query.minPrice,
            lte: query.maxPrice,
          }
        : undefined,
    status: status ?? ServiceStatus.ACTIVE, // nếu không truyền thì mặc định ACTIVE
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

async findAllForCustomer(query: ServiceQueryDTO): Promise<PaginationResponse<ServiceDto>> {
  const { page = 1, pageSize = 10 } = query;

  const where: Prisma.ServiceWhereInput = {
    name: query.name ? { contains: query.name, mode: 'insensitive' } : undefined,
    price:
      query.minPrice || query.maxPrice
        ? {
            gte: query.minPrice,
            lte: query.maxPrice,
          }
        : undefined,
    status: 'ACTIVE', // khách hàng chỉ được thấy service ACTIVE
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
      data: {
        ...createServiceDto,
        status: ServiceStatus.ACTIVE,
      }
    });
  }

  async getServiceByNameForCustomer(name: string): Promise<Service[]> {
  const services = await this.prisma.service.findMany({
    where: {
      name: {
        contains: name,
        mode: 'insensitive',
      },
      status: ServiceStatus.ACTIVE, // chỉ lấy ACTIVE
    },
  });

  if (!services.length) {
    throw new NotFoundException(`No active services found with name containing "${name}"`);
  }

  return services;
}

  async getServiceByNameForAdmin(name: string): Promise<Service[]> {
  const services = await this.prisma.service.findMany({
    where: {
      name: {
        contains: name,
        mode: 'insensitive',
      },
    },
  });

  if (!services.length) {
    throw new NotFoundException(`No services found with name containing "${name}"`);
  }

  return services;
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
    return this.prisma.service.update({
      where: { id },
      data: { status: ServiceStatus.INACTIVE },
    });
  }
}
