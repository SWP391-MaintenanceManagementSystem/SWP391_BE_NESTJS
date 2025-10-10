import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBookingDTO } from './dto/create-booking.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { BookingDTO } from './dto/booking.dto';
import { plainToInstance } from 'class-transformer';
import { BookingQueryDTO } from './dto/booking-query.dto';
import { Package, Prisma, Service } from '@prisma/client';
import * as dateFns from 'date-fns';
import { buildBookingSearch } from 'src/common/search/search.util';
import { buildBookingOrderBy } from 'src/common/sort/sort.util';
import { BookingDetailService } from '../booking-detail/booking-detail.service';
import { getVNDayOfWeek } from 'src/utils';
@Injectable()
export class BookingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bookingDetailService: BookingDetailService
  ) {}
  async createBooking(bookingData: CreateBookingDTO, customerId: string): Promise<BookingDTO> {
    const {
      bookingDate,
      centerId,
      note,
      vehicleId,
      serviceIds = [],
      packageIds = [],
    } = bookingData;

    const matchedShift = await this.prismaService.shift.findFirst({
      where: {
        status: 'ACTIVE',
        centerId,
        startDate: { lte: bookingDate },
        endDate: { gte: bookingDate },
        repeatDays: { has: getVNDayOfWeek(bookingDate) },
      },
    });

    if (!matchedShift) {
      throw new BadRequestException('No matching shift for this booking date');
    }

    const existingBooking = await this.prismaService.booking.findFirst({
      where: {
        customerId,
        vehicleId,
        shiftId: matchedShift.id,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      },
    });

    if (existingBooking) {
      throw new BadRequestException('You already have a booking for this vehicle at this time');
    }

    const bookingHour = bookingDate.getHours();
    const startHour = matchedShift.startTime.getHours();
    const endHour = matchedShift.endTime.getHours();

    if (bookingHour < startHour || bookingHour >= endHour) {
      throw new BadRequestException('Booking time is outside of shift hours');
    }

    if (serviceIds.length === 0 && packageIds.length === 0) {
      throw new BadRequestException('At least one service or package must be selected');
    }

    const services: Service[] = serviceIds.length
      ? await this.prismaService.service.findMany({
          where: { id: { in: serviceIds } },
        })
      : [];

    const packages: Package[] = packageIds.length
      ? await this.prismaService.package.findMany({
          where: { id: { in: packageIds } },
        })
      : [];

    if (services.length !== serviceIds.length) {
      const missing = serviceIds.filter(id => !services.find(s => s.id === id));
      throw new BadRequestException(`Services not found: ${missing.join(', ')}`);
    }
    if (packages.length !== packageIds.length) {
      const missing = packageIds.filter(id => !packages.find(p => p.id === id));
      throw new BadRequestException(`Packages not found: ${missing.join(', ')}`);
    }

    const totalCost =
      services.reduce((sum, s) => sum + s.price, 0) + packages.reduce((sum, p) => sum + p.price, 0);

    const createdBooking = await this.prismaService.booking.create({
      data: {
        bookingDate,
        shiftId: matchedShift.id,
        customerId,
        totalCost,
        note,
        vehicleId,
        centerId,
      },
    });

    const bookingDetailsData = [
      ...services.map(s => ({
        bookingId: createdBooking.id,
        serviceId: s.id,
        unitPrice: s.price,
        quantity: 1,
      })),
      ...packages.map(p => ({
        bookingId: createdBooking.id,
        packageId: p.id,
        unitPrice: p.price,
        quantity: 1,
      })),
    ];

    if (bookingDetailsData.length > 0) {
      await this.bookingDetailService.createManyBookingDetails(bookingDetailsData);
    }

    return plainToInstance(BookingDTO, createdBooking);
  }

  async getBookingById(bookingId: string): Promise<BookingDTO | null> {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
    });
    return booking ? plainToInstance(BookingDTO, booking) : null;
  }

  async getBookings(filterOptions: BookingQueryDTO): Promise<PaginationResponse<BookingDTO>> {
    const {
      search,
      status,
      bookingDate,
      centerId,
      shiftId,
      page = 1,
      pageSize = 10,
      orderBy = 'createdAt',
      sortBy = 'desc',
    } = filterOptions;

    const where: Prisma.BookingWhereInput = {
      ...(status && { status }),
      ...(centerId && { centerId }),
      ...(shiftId && { shiftId }),
      ...(bookingDate && {
        bookingDate: {
          gte: dateFns.startOfDay(bookingDate),
          lte: dateFns.endOfDay(bookingDate),
        },
      }),
      ...buildBookingSearch(search),
    };

    const [totalItems, bookings] = await this.prismaService.$transaction([
      this.prismaService.booking.count({ where }),
      this.prismaService.booking.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: buildBookingOrderBy(orderBy, sortBy),
        include: {
          customer: {
            include: { account: true },
          },
          vehicle: true,
          serviceCenter: true,
          shift: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);
    return {
      data: bookings.map(booking => plainToInstance(BookingDTO, booking)),
      page,
      pageSize,
      total: totalItems,
      totalPages,
    };
  }
}
