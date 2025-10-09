import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDetailDTO } from './dto/create-booking-detail.dto';

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
}
