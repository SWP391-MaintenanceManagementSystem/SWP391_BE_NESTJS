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

  async updateBookingDetails(bookingId: string, updateData: UpdateBookingDetailDTO) {
    const currentDetails = await this.prismaService.bookingDetail.findMany({
      where: { bookingId },
    });

    const currentServiceIds = currentDetails.filter(d => d.serviceId).map(d => d.serviceId!);

    const currentPackageIds = currentDetails.filter(d => d.packageId).map(d => d.packageId!);

    const newServiceIds = updateData.services || [];
    const newPackageIds = updateData.packages || [];

    const storedServices = newServiceIds.length
      ? await this.prismaService.service.findMany({
          where: { id: { in: newServiceIds } },
          select: { id: true, price: true },
        })
      : [];

    const storedPackages = newPackageIds.length
      ? await this.prismaService.package.findMany({
          where: { id: { in: newPackageIds } },
          select: { id: true, price: true },
        })
      : [];

    await this.prismaService.bookingDetail.deleteMany({
      where: {
        bookingId,
        serviceId: { in: currentServiceIds.filter(id => !newServiceIds.includes(id)) },
      },
    });

    await this.prismaService.bookingDetail.deleteMany({
      where: {
        bookingId,
        packageId: { in: currentPackageIds.filter(id => !newPackageIds.includes(id)) },
      },
    });

    for (const service of storedServices) {
      if (!currentServiceIds.includes(service.id)) {
        await this.prismaService.bookingDetail.create({
          data: {
            bookingId,
            serviceId: service.id,
            unitPrice: service.price,
            quantity: 1,
          },
        });
      }
    }

    for (const pkg of storedPackages) {
      if (!currentPackageIds.includes(pkg.id)) {
        await this.prismaService.bookingDetail.create({
          data: {
            bookingId,
            packageId: pkg.id,
            unitPrice: pkg.price,
            quantity: 1,
          },
        });
      }
    }
  }

  async calculateTotalCost(bookingId: string): Promise<number> {
    const details = await this.prismaService.bookingDetail.findMany({
      where: { bookingId },
      select: { unitPrice: true },
    });
    return details.reduce((sum, d) => sum + d.unitPrice, 0);
  }
}
