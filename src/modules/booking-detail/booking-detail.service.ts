import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDetailDTO } from './dto/create-booking-detail.dto';
import { UpdateBookingDetailDTO } from './dto/update-booking-detail.dto';

@Injectable()
export class BookingDetailService {
  constructor(private readonly prismaService: PrismaService) {}

  async createBookingDetail(bookingDetailData: CreateBookingDetailDTO): Promise<any> {
    const { packageId, serviceId } = bookingDetailData;
    if (!packageId && !serviceId) {
      throw new BadRequestException('Either packageId or serviceId must be provided');
    }
    const createdBookingDetail = await this.prismaService.bookingDetail.create({
      data: bookingDetailData,
    });
    return createdBookingDetail;
  }

  async createManyBookingDetails(bookingDetailsData: CreateBookingDetailDTO[]): Promise<any> {
    if (bookingDetailsData.length === 0) {
      return;
    }
    await this.prismaService.bookingDetail.createMany({
      data: bookingDetailsData,
    });
  }

  private async filterServicesInPackages(
    services: { id: string }[],
    packages: { id: string }[]
  ): Promise<{ id: string }[]> {
    if (!packages.length || !services.length) return services;

    const packageServiceMappings = await this.prismaService.packageDetail.findMany({
      where: { packageId: { in: packages.map(p => p.id) } },
    });

    const serviceIdsInPackages = new Set(packageServiceMappings.map(ps => ps.serviceId));
    return services.filter(s => !serviceIdsInPackages.has(s.id));
  }

  async updateBookingDetails(bookingId: string, updateData: UpdateBookingDetailDTO) {
    return this.prismaService.$transaction(async tx => {
      //  Lấy dữ liệu hiện tại
      const currentDetails = await tx.bookingDetail.findMany({
        where: { bookingId },
      });

      const currentServiceIds = currentDetails.filter(d => d.serviceId).map(d => d.serviceId!);
      const currentPackageIds = currentDetails.filter(d => d.packageId).map(d => d.packageId!);

      const newServiceIds = updateData.services || [];
      const newPackageIds = updateData.packages || [];

      //  Lấy thông tin package mới + các service thuộc package
      const storedPackages = newPackageIds.length
        ? await tx.package.findMany({
            where: { id: { in: newPackageIds } },
            select: { id: true, price: true },
          })
        : [];

      const packageServiceMappings = storedPackages.length
        ? await tx.packageDetail.findMany({
            where: { packageId: { in: storedPackages.map(p => p.id) } },
            select: { serviceId: true },
          })
        : [];

      const serviceIdsInNewPackages = new Set(packageServiceMappings.map(ps => ps.serviceId));

      //  Xác định danh sách service hợp lệ (lọc ra service nào KHÔNG nằm trong package)
      const allSelectedServices = newServiceIds.length
        ? await tx.service.findMany({
            where: { id: { in: newServiceIds } },
            select: { id: true },
          })
        : [];

      const filteredServiceIds = await this.filterServicesInPackages(
        allSelectedServices,
        storedPackages
      );

      const storedServices = filteredServiceIds.length
        ? await tx.service.findMany({
            where: { id: { in: filteredServiceIds.map(s => s.id) } },
            select: { id: true, price: true },
          })
        : [];

      // Xoá trước các service lẻ bị trùng với service trong package mới
      if (serviceIdsInNewPackages.size > 0) {
        await tx.bookingDetail.deleteMany({
          where: {
            bookingId,
            serviceId: { in: Array.from(serviceIdsInNewPackages) },
          },
        });
      }

      // Xoá các service hoặc package bị bỏ chọn
      const removedServiceIds = currentServiceIds.filter(id => !newServiceIds.includes(id));
      const removedPackageIds = currentPackageIds.filter(id => !newPackageIds.includes(id));

      if (removedServiceIds.length > 0) {
        await tx.bookingDetail.deleteMany({
          where: { bookingId, serviceId: { in: removedServiceIds } },
        });
      }

      if (removedPackageIds.length > 0) {
        await tx.bookingDetail.deleteMany({
          where: { bookingId, packageId: { in: removedPackageIds } },
        });
      }

      // Chuẩn bị dữ liệu thêm mới
      const newServicesToAdd = storedServices.filter(s => !currentServiceIds.includes(s.id));
      const newPackagesToAdd = storedPackages.filter(p => !currentPackageIds.includes(p.id));

      const createData = [
        ...newServicesToAdd.map(s => ({
          bookingId,
          serviceId: s.id,
          unitPrice: s.price,
          quantity: 1,
        })),
        ...newPackagesToAdd.map(p => ({
          bookingId,
          packageId: p.id,
          unitPrice: p.price,
          quantity: 1,
        })),
      ];

      // Thêm mới (nếu có)
      if (createData.length > 0) {
        await tx.bookingDetail.createMany({ data: createData });
      }

      return {
        success: true,
        added: createData.length,
        removed: removedServiceIds.length + removedPackageIds.length,
      };
    });
  }

  async calculateTotalCost(bookingId: string): Promise<number> {
    const details = await this.prismaService.bookingDetail.findMany({
      where: { bookingId },
      select: { unitPrice: true },
    });
    return details.reduce((sum, d) => sum + d.unitPrice, 0);
  }

  async markCompleteDetails(bookingId: string, detailIds: string[]): Promise<void> {
    await this.prismaService.$transaction(async tx => {
      const details = await tx.bookingDetail.findMany({
        where: {
          id: { in: detailIds },
          bookingId: bookingId,
          status: { not: 'COMPLETED' },
        },
        include: {
          package: {
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
          },
          service: {
            include: {
              ServicePart: { include: { part: true } },
            },
          },
        },
      });

      if (details.length !== detailIds.length) {
        throw new BadRequestException(
          'Some tasks are invalid, not in booking or already completed'
        );
      }
      const partsMap: Record<string, number> = {};

      for (const detail of details) {
        if (detail.service) {
          detail.service.ServicePart.forEach(sp => {
            partsMap[sp.partId] = (partsMap[sp.partId] || 0) + sp.quantity;
          });
        }

        if (detail.package) {
          detail.package.packageDetails.forEach(pd => {
            pd.service.ServicePart.forEach(sp => {
              partsMap[sp.partId] = (partsMap[sp.partId] || 0) + sp.quantity;
            });
          });
        }
      }

      for (const [partId, totalQty] of Object.entries(partsMap)) {
        const part = await tx.part.findUnique({ where: { id: partId } });
        if (!part || part.stock < totalQty) {
          throw new BadRequestException(`Insufficient stock for part ID: ${partId}`);
        }
        await tx.part.update({
          where: { id: partId },
          data: { stock: { decrement: totalQty } },
        });
      }

      await tx.bookingDetail.updateMany({
        where: { id: { in: detailIds } },
        data: { status: 'COMPLETED' },
      });
    });
  }

  async markInprogressDetails(bookingId: string): Promise<void> {
    await this.prismaService.bookingDetail.updateMany({
      where: {
        bookingId: bookingId,
      },
      data: { status: 'IN_PROGRESS' },
    });
  }
}
