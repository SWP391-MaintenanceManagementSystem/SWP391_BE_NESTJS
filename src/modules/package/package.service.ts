import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PackageDto } from './dto/package.dto';
import { plainToInstance } from 'class-transformer';
import { PakageQueryDTO } from './dto/pakage-query.dto';
import { PaginationResponse, PaginationResponseDTO } from 'src/common/dto/pagination-response.dto';
import { PackageStatus, Prisma } from '@prisma/client';
import { PackageDetailDTO } from './dto/package-detail.dto';
import { ServiceDto } from '../service/dto/service.dto';

@Injectable()
export class PackageService {
  constructor(private readonly prisma: PrismaService) {}

  async createPackage(createPackageDto: CreatePackageDto): Promise<PackageDto> {
    const { name, discountRate, serviceIds } = createPackageDto;


  const services = await this.prisma.service.findMany({
    where: { id: { in: serviceIds } },
    include: {
      ServicePart: {
        include: { part: true },
      },
    },
  });

  if (!services.length) {
    throw new NotFoundException('No valid services found for given IDs');
  }


  const serviceDtos = plainToInstance(
    ServiceDto,
    services.map((s) => ({
      ...s,
      parts: s.ServicePart.map((sp) => sp.part),
    })),
    { excludeExtraneousValues: true },
  );


  const totalServicePrice = serviceDtos.reduce(
    (sum, s) => sum + (s.finalPrice || 0),
    0,
  );


  const finalPackagePrice = totalServicePrice * (1 - (discountRate || 0) / 100);


  const packageData = await this.prisma.package.create({
    data: {
      name,
      discountRate,
      price: finalPackagePrice,
      packageDetails: {
        create: serviceIds.map((serviceId) => ({ serviceId })),
      },
    },
    include: {
      packageDetails: { include: { service: true } },
    },
  });


  packageData.packageDetails = packageData.packageDetails.map((pd) => {
    const matchedService = serviceDtos.find((s) => s.id === pd.service.id);
    const finalPrice = matchedService?.finalPrice ?? pd.service.price;

    return {
      ...pd,
      service: {
        ...pd.service,
        finalPrice,
      },
    };
  });


  packageData.price = finalPackagePrice;


  console.log('CREATE -> stored package.price in DB:', finalPackagePrice);
  console.log('CREATE -> returned package.price:', packageData.price);


  return plainToInstance(PackageDto, packageData, {
    excludeExtraneousValues: true,
  });
  }

  async getAllPackages(query: PakageQueryDTO): Promise<PaginationResponse<PackageDto>> {
  const { page = 1, pageSize = 10, name, price, sortBy = 'createdAt', orderBy = 'desc' } = query;

  const where: Prisma.PackageWhereInput = {
    name: name ? { contains: name, mode: 'insensitive' } : undefined,
    price: price ? { lte: price } : undefined,
    status: 'ACTIVE',
  };


  const orderByArray: Prisma.Enumerable<Prisma.PackageOrderByWithRelationInput> = [];
  if (['name', 'price', 'createdAt'].includes(sortBy)) {
    orderByArray.push({ [sortBy]: orderBy });
  } else {
    orderByArray.push({ createdAt: 'desc' });
  }
  orderByArray.push({ createdAt: 'desc' });
  orderByArray.push({ id: 'desc' });

  const [packages, total] = await this.prisma.$transaction([
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
      orderBy: orderByArray,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    this.prisma.package.count({ where }),
  ]);

  const processed = packages.map((pkg) => {
    const { packageDetails, finalPackagePrice } = this.computeFinalPriceForPackage(pkg);
    return { ...pkg, packageDetails, price: finalPackagePrice };
  });

  return {
    data: plainToInstance(PackageDto, processed, { excludeExtraneousValues: true }),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}


async getAllPackagesForAdmin(query: PakageQueryDTO): Promise<PaginationResponse<PackageDto>> {
  const { page = 1, pageSize = 10, name, price, status, sortBy = 'createdAt', orderBy = 'desc' } = query;

  const where: Prisma.PackageWhereInput = {
    name: name ? { contains: name, mode: 'insensitive' } : undefined,
    price: price ? { lte: price } : undefined,
    status: status ?? undefined, // admin có thể xem mọi trạng thái
  };

  const orderByArray: Prisma.Enumerable<Prisma.PackageOrderByWithRelationInput> = [];
  if (['name', 'price', 'createdAt', 'status'].includes(sortBy)) {
    orderByArray.push({ [sortBy]: orderBy });
  } else {
    orderByArray.push({ createdAt: 'desc' });
  }
  orderByArray.push({ createdAt: 'desc' });
  orderByArray.push({ id: 'desc' });

  const [packages, total] = await this.prisma.$transaction([
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
      orderBy: orderByArray,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    this.prisma.package.count({ where }),
  ]);

  const processed = packages.map((pkg) => {
    const { packageDetails, finalPackagePrice } = this.computeFinalPriceForPackage(pkg);
    return { ...pkg, packageDetails, price: finalPackagePrice, status: pkg.status };
  });

  return {
    data: plainToInstance(PackageDto, processed, { excludeExtraneousValues: true }),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
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


  async getPackageById(id: string): Promise<PackageDto> {
  const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: {
        packageDetails: {
          include: {
            service: {
              include: { ServicePart: { include: { part: true } } },
            },
          },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    const { packageDetails, finalPackagePrice } =
      this.computeFinalPriceForPackage(pkg);

    const result = { ...pkg, packageDetails, price: finalPackagePrice };

    return plainToInstance(PackageDto, result, {
      excludeExtraneousValues: true,
    });
}

  async updatePackage(id: string, updatePackageDto: UpdatePackageDto): Promise<PackageDto> {
const existingPackage = await this.prisma.package.findUnique({
    where: { id },
    include: {
      packageDetails: {
        include: {
          service: {
            include: { ServicePart: { include: { part: true } } },
          },
        },
      },
    },
  });

  if (!existingPackage) {
    throw new NotFoundException(`Package with ID ${id} not found`);
  }

  const { name, discountRate, serviceIds } = updatePackageDto;


  if (serviceIds && serviceIds.length > 0) {

    await this.prisma.packageDetail.deleteMany({
      where: { packageId: id },
    });


    await this.prisma.packageDetail.createMany({
      data: serviceIds.map((serviceId) => ({
        packageId: id,
        serviceId,
      })),
    });
  }


  const refreshedPackage = await this.prisma.package.findUnique({
    where: { id },
    include: {
      packageDetails: {
        include: {
          service: {
            include: { ServicePart: { include: { part: true } } },
          },
        },
      },
    },
  });

  if (!refreshedPackage) {
  throw new NotFoundException(`Package with ID ${id} not found`);
  }


  const { packageDetails, finalPackagePrice } = this.computeFinalPriceForPackage({
    ...refreshedPackage,
    discountRate: discountRate ?? refreshedPackage.discountRate,
  });




  const updatedPackage = await this.prisma.package.update({
    where: { id },
    data: {
      name: name ?? refreshedPackage.name,
      discountRate: discountRate ?? refreshedPackage.discountRate,
      price: finalPackagePrice,
    },
    include: {
      packageDetails: {
        include: {
          service: {
            include: { ServicePart: { include: { part: true } } },
          },
        },
      },
    },
  });


  const result = {
    ...updatedPackage,
    packageDetails,
    price: finalPackagePrice,
  };

  return plainToInstance(PackageDto, result, {
    excludeExtraneousValues: true,
  });
  }

  async deletePackage(id: string) {
    const existingPackage = await this.prisma.package.findUnique({ where: { id } });
    if (!existingPackage) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }
    return this.prisma.package.update({
      where: {id},
      data: {status: PackageStatus.INACTIVE}
    })
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

  private computeFinalPriceForPackage(pkg: any) {

  const packageDetails = pkg.packageDetails.map((pd: any) => {
    const partsTotal =
      pd.service.ServicePart?.reduce(
        (sum: number, sp: any) => sum + (sp.part?.price ?? 0),
        0
      ) ?? 0;

    const finalServicePrice = (pd.service.price ?? 0) + partsTotal;

    return {
      ...pd,
      service: {
        ...pd.service,
        finalPrice: finalServicePrice,
      },
    };
  });


  const totalServicePrice = packageDetails.reduce(
    (sum: number, pd: any) => sum + (pd.service.finalPrice ?? 0) * (pd.quantity ?? 1),
    0
  );

  const discountRate = pkg.discountRate ?? 0;
  const finalPackagePrice = totalServicePrice * (1 - discountRate / 100);

  return { packageDetails, finalPackagePrice };
}
}
