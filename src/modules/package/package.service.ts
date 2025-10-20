import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PackageDto } from './dto/package.dto';
import { plainToInstance } from 'class-transformer';
import { PakageQueryDTO } from './dto/pakage-query.dto';
import { PaginationResponse, PaginationResponseDTO } from 'src/common/dto/pagination-response.dto';
import { PackageStatus, Prisma } from '@prisma/client';
import { PackageDetailDTO } from './dto/package-detail.dto';

@Injectable()
export class PackageService {
  constructor(private readonly prisma: PrismaService) {}

  async createPackage(createPackageDto: CreatePackageDto): Promise<PackageDto> {
    const { name, price, discountRate, serviceIds } = createPackageDto;

    const packageData = await this.prisma.package.create({
      data: {
        name,
        price,
        discountRate: discountRate || 0,
        packageDetails: {
          create:
            serviceIds?.map(serviceId => ({
              serviceId,
              quantity: 1,
            })) || [],
        },
      },
      include: {
        packageDetails: {
          include: { service: true },
        },
      },
    });

    const result = { ...packageData, totalPrice: createPackageDto.totalPrice };

    return plainToInstance(PackageDto, result, { excludeExtraneousValues: true });
  }

  async getAllPackages(query: PakageQueryDTO): Promise<PaginationResponse<PackageDto>> {
    const { page = 1, pageSize = 10, name, price, status, sortBy, orderBy } = query;

    const where: Prisma.PackageWhereInput = {
      name: name ? { contains: name, mode: 'insensitive' } : undefined,
      price: price ? { lte: price } : undefined,
      status: status ?? 'ACTIVE',
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.package.findMany({
        where,
        include: {
          packageDetails: {
            include: {
              service: {
                include: {
                  ServicePart: { include: { part: true } },
                },
              },
            },
          },
        },
        orderBy: { [sortBy ?? 'createdAt']: orderBy ?? 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.package.count({ where }),
    ]);

    return {
      data: plainToInstance(PackageDto, data, { excludeExtraneousValues: true }),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };

    // const packages = await this.prisma.package.findMany({
    //   orderBy: { createdAt: 'asc' },
    //   include: {
    //     packageDetails: {
    //       include: {
    //         service: {
    //           include: {
    //             ServicePart: { include: { part: true } },
    //           },
    //         },
    //       },
    //     },
    //   },
    // });
    // return plainToInstance(PackageDto, packages, { excludeExtraneousValues: true });
  }

  async getPackageById(id: string): Promise<PackageDto> {
    const packageData = await this.prisma.package.findUnique({
      where: { id },
      include: {
        packageDetails: {
          include: {
            service: {
              include: {
                ServicePart: { include: { part: true } },
              },
            },
          },
        },
      },
    });
    if (!packageData) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }
    return plainToInstance(PackageDto, packageData, { excludeExtraneousValues: true });
  }

  async updatePackage(id: string, updatePackageDto: UpdatePackageDto): Promise<PackageDto> {
    const existingPackage = await this.prisma.package.findUnique({ where: { id } });
    if (!existingPackage) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    const { name, price, discountRate } = updatePackageDto;

    const updatedPackage = await this.prisma.package.update({
      where: { id },
      data: {
        name: name ?? existingPackage.name,
        price: price ?? existingPackage.price,
        discountRate: discountRate ?? existingPackage.discountRate,
      },
      include: { packageDetails: { include: { service: true } } },
    });

    const result = { ...updatedPackage, totalPrice: updatePackageDto.totalPrice };

    return plainToInstance(PackageDto, result, { excludeExtraneousValues: true });
  }

  async deletePackage(id: string): Promise<string> {
    const existingPackage = await this.prisma.package.findUnique({ where: { id } });
    if (!existingPackage) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }
    await this.prisma.package.delete({ where: { id } });
    return `Package with ID ${id} has been deleted`;
  }

  async getPackageByNameForCustomer(name: string): Promise<PackageDetailDTO[]> {
    const packages = await this.prisma.package.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
      },
      include: {
        packageDetails: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!packages.length) {
      throw new NotFoundException(`No packages found with name containing "${name}"`);
    }

    const mappedData = packages.map(pkg => ({
      ...pkg,
      services: pkg.packageDetails.map(pd => ({
        id: pd.service.id,
        name: pd.service.name,
        price: pd.service.price,
      })),
    }));

    return plainToInstance(PackageDetailDTO, mappedData, { excludeExtraneousValues: true });
  }
}
