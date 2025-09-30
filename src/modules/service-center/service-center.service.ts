import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { CreateServiceCenterDto } from "./dto/create-service-center.dto";
import { UpdateServiceCenterDto } from "./dto/update-service-center.dto";
import { CenterStatus, Prisma, ServiceCenter } from "@prisma/client";
import { PaginationResponse } from "src/common/dto/pagination-response.dto";
import { ServiceCenterQueryDTO } from "./dto/service-center.query.dto";
import { ServiceCenterDto } from "./dto/service-center.dto";
import { plainToInstance } from "class-transformer";
import { BookingStatus } from "@prisma/client";
import { ConflictException } from "@nestjs/common/exceptions/conflict.exception";


@Injectable()
export class ServiceCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async createServiceCenter(createServiceCenterDto: CreateServiceCenterDto) {
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

  async getServiceCenters(filter: ServiceCenterQueryDTO): Promise<PaginationResponse<ServiceCenterDto>> {
    let { page = 1, pageSize = 10} = filter;
    page < 1 && (page = 1);
    pageSize < 1 && (pageSize = 10);

    const where: Prisma.ServiceCenterWhereInput = {

      status: filter.status,
      name: filter.name ? { contains: filter.name, mode: 'insensitive' } : undefined,
      address: filter.address ? { contains: filter.address, mode: 'insensitive' } : undefined,
    };

    const [serviceCenters, total] = await this.prisma.$transaction([
      this.prisma.serviceCenter.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: filter.sortBy
          ? { [filter.sortBy]: filter.orderBy ?? 'asc' }
          : { createdAt: 'asc' },
      }),
      this.prisma.serviceCenter.count({ where }),
    ]);

    return {
      data: serviceCenters.map(item => plainToInstance(ServiceCenterDto, item)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

  }

  async getServiceCenterById(id: string): Promise<ServiceCenterDto> {
    const serviceCenter = await this.prisma.serviceCenter.findUnique({
      where: { id },
      include: {
        workCenters: {
          include: {
            employee: {
              include: { account: true }
            }
          }
        },
        shifts: true,
        _count: {
          select: {
            workCenters: true,
            shifts: true,
            bookings: true
          }
        }
      },
    });

    if (!serviceCenter) {
      throw new NotFoundException(`Service center with ID ${id} not found`);
    }

    return plainToInstance(ServiceCenterDto, serviceCenter);
  }

  async updateServiceCenter(id: string, updateServiceCenterDto: UpdateServiceCenterDto): Promise<ServiceCenterDto> {
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
            }
          ]
        },
      });

      if (existingCenter) {
        throw new ConflictException('A service center with the same name and address already exists');
      }
    }

    const updatedServiceCenter = await this.prisma.serviceCenter.update({
      where: { id },
      data: updateServiceCenterDto,
    });
    return plainToInstance(ServiceCenterDto, updatedServiceCenter);
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
                  in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROCESS'] // Active bookings
                }
              }
            }
          }
        }
      }
    });

    if (!existingServiceCenter) {
      throw new NotFoundException(`Service center with ID ${id} not found`);
    }

    if (existingServiceCenter._count.bookings > 0) {
      throw new ConflictException('Cannot close service center with active bookings');
    }

    if (existingServiceCenter._count.workCenters > 0) {
      throw new ConflictException('Cannot close service center with assigned employees. Please reassign them first.');
    }

    await this.prisma.serviceCenter.update({
      where: { id },
      data: { status: CenterStatus.CLOSED },
    });
  }

  async getAssignedCenters(accountId: string): Promise<ServiceCenterDto[]> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException(`Employee with ID ${accountId} not found`);
    }

    const workCenters = await this.prisma.workCenter.findMany({
      where: { employeeId: accountId },
      include: {
        serviceCenter: {
          include: {
            _count: {
              select: {
                workCenters: true,
                shifts: true,
                bookings: true
              }
            }
          }
        }
      },
    });

    return workCenters.map(wc =>
      plainToInstance(ServiceCenterDto, wc.serviceCenter)
    );
  }
}
