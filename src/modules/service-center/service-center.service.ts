import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { ServiceCenterDTO } from './dto/service-center.dto';
import { CreateServiceCenterDTO } from './dto/create-service-center.dto';
import { UpdateServiceCenterDTO } from './dto/update-service-center.dto';
import { CenterStatus, Prisma } from '@prisma/client';
import { ServiceCenterQueryDTO } from './dto/service-center.query.dto';
import { plainToInstance } from 'class-transformer';
import { ConflictException } from '@nestjs/common/exceptions/conflict.exception';

@Injectable()
export class ServiceCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async createServiceCenter(createServiceCenterDto: CreateServiceCenterDTO) {
    const existingCenter = await this.prisma.serviceCenter.findFirst({
      where: {
        name: createServiceCenterDto.name,
        address: createServiceCenterDto.address,
      },
    });

    if (existingCenter) {
      throw new ConflictException('A service center with the same name and address already exists');
    }

    const serviceCenter = await this.prisma.serviceCenter.create({
      data: createServiceCenterDto,
    });
    return serviceCenter;
  }

  async getServiceCenters(filter: ServiceCenterQueryDTO): Promise<{ data: ServiceCenterDTO[] }> {
    const where: Prisma.ServiceCenterWhereInput = {
      status: filter.status,
      id: filter.id ? { contains: filter.id, mode: 'insensitive' } : undefined,
      name: filter.name ? { contains: filter.name, mode: 'insensitive' } : undefined,
      address: filter.address ? { contains: filter.address, mode: 'insensitive' } : undefined,
    };

    const serviceCenters = await this.prisma.serviceCenter.findMany({
      where,
      orderBy: filter.sortBy ? { [filter.sortBy]: filter.orderBy ?? 'asc' } : { createdAt: 'asc' },
    });

    return {
      data: serviceCenters.map(item =>
        plainToInstance(ServiceCenterDTO, item, { excludeExtraneousValues: true })
      ),
    };
  }

  async getServiceCenterById(id: string): Promise<ServiceCenterDTO> {
    const serviceCenter = await this.prisma.serviceCenter.findUnique({
      where: { id },
      include: {
        workCenters: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            employee: {
              select: {
                account: {
                  select: {
                    id: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    avatar: true,
                    createdAt: true,
                    updatedAt: true,
                    employee: {
                      select: {
                        firstName: true,
                        lastName: true,
                        createdAt: true,
                        updatedAt: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
        _count: {
          select: {
            workCenters: true,
            shifts: true,
            bookings: true,
          },
        },
      },
    });

    if (!serviceCenter) {
      throw new NotFoundException(`Service center with ID ${id} not found`);
    }

    return plainToInstance(ServiceCenterDTO, serviceCenter, {
      excludeExtraneousValues: true,
    });
  }

  async updateServiceCenter(
    id: string,
    updateServiceCenterDto: UpdateServiceCenterDTO
  ): Promise<ServiceCenterDTO> {
    const existingServiceCenter = await this.prisma.serviceCenter.findUnique({
      where: { id },
    });

    if (!existingServiceCenter) {
      throw new NotFoundException(`Service center with ID ${id} not found`);
    }

    if (updateServiceCenterDto.name || updateServiceCenterDto.address) {
      const existingCenter = await this.prisma.serviceCenter.findFirst({
        where: {
          id: { not: id },
          OR: [
            {
              name: updateServiceCenterDto.name || existingServiceCenter.name,
              address: updateServiceCenterDto.address || existingServiceCenter.address,
            },
          ],
        },
      });

      if (existingCenter) {
        throw new ConflictException(
          'A service center with the same name and address already exists'
        );
      }
    }

    const updatedServiceCenter = await this.prisma.serviceCenter.update({
      where: { id },
      data: updateServiceCenterDto,
    });
    return plainToInstance(ServiceCenterDTO, updatedServiceCenter);
  }

  async deleteServiceCenter(id: string): Promise<void> {
    const existingServiceCenter = await this.prisma.serviceCenter.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            workCenters: true,
            shifts: true,
            bookings: {
              where: {
                status: {
                  in: ['PENDING', 'ASSIGNED', 'CHECKED_IN', 'IN_PROGRESS'], // Active bookings
                },
              },
            },
          },
        },
      },
    });

    if (!existingServiceCenter) {
      throw new NotFoundException(`Service center with ID ${id} not found`);
    }

    if (existingServiceCenter._count.bookings > 0) {
      throw new ConflictException('Cannot close service center with active bookings');
    }

    if (existingServiceCenter._count.workCenters > 0) {
      throw new ConflictException(
        'Cannot close service center with assigned employees. Please reassign them first.'
      );
    }

    await this.prisma.serviceCenter.update({
      where: { id },
      data: { status: CenterStatus.CLOSED },
    });
  }
}
