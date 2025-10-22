import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBookingDTO } from './dto/create-booking.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { BookingDTO } from './dto/booking.dto';
import { plainToInstance } from 'class-transformer';
import { BookingQueryDTO } from './dto/booking-query.dto';
import { AccountRole, BookingStatus, Package, Prisma, Service } from '@prisma/client';
import * as dateFns from 'date-fns';
import { buildBookingSearch } from 'src/common/search/search.util';
import { buildBookingOrderBy } from 'src/common/sort/sort.util';
import { BookingDetailService } from '../booking-detail/booking-detail.service';
import { JWT_Payload } from 'src/common/types';
import { CustomerUpdateBookingDTO } from './dto/customer-update-booking.dto';
import { StaffUpdateBookingDTO } from './dto/staff-update-booking.dto';
import { AdminUpdateBookingDTO } from './dto/admin-update-booking.dto';
import { CustomerBookingService } from './customer-booking.service';
import { AdminBookingService } from './admin-booking.service';
import { StaffBookingService } from './staff-booking.service';
import { StaffBookingDTO } from './dto/staff-booking.dto';
import { TechnicianBookingService } from './technician-booking.service';
@Injectable()
export class BookingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bookingDetailService: BookingDetailService,
    private readonly customerBookingService: CustomerBookingService,
    private readonly adminBookingService: AdminBookingService,
    private readonly staffBookingService: StaffBookingService,
    private readonly technicianBookingService: TechnicianBookingService
  ) {}
  async createBooking(
    bookingData: CreateBookingDTO,
    customerId: string
  ): Promise<{ booking: BookingDTO; warning?: string }> {
    const {
      bookingDate,
      centerId,
      note,
      vehicleId,
      serviceIds = [],
      packageIds = [],
    } = bookingData;

    const workSchedule = await this.prismaService.workSchedule.findFirst({
      where: {
        date: { gte: dateFns.startOfDay(bookingDate), lt: dateFns.endOfDay(bookingDate) },
        shift: {
          centerId,
          status: 'ACTIVE',
          startTime: { lte: bookingDate },
          endTime: { gt: bookingDate },
        },
      },
      include: { shift: true },
    });

    if (!workSchedule) throw new BadRequestException('No matching shift for this booking date');

    const existingBooking = await this.prismaService.booking.findFirst({
      where: {
        customerId,
        vehicleId,
        shiftId: workSchedule.shiftId,
        status: { in: ['PENDING', 'ASSIGNED', 'CHECKED_IN'] },
      },
    });
    if (existingBooking)
      throw new BadRequestException('You already have a booking for this vehicle at this time');

    if (serviceIds.length === 0 && packageIds.length === 0)
      throw new BadRequestException('At least one service or package must be selected');

    const services: Service[] = serviceIds.length
      ? await this.prismaService.service.findMany({ where: { id: { in: serviceIds } } })
      : [];
    const packages: Package[] = packageIds.length
      ? await this.prismaService.package.findMany({ where: { id: { in: packageIds } } })
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

    let warning: string | undefined = undefined;
    if (workSchedule.shift.maximumSlot) {
      const currentBookingCount = await this.prismaService.booking.count({
        where: {
          shiftId: workSchedule.shiftId,
          status: { in: ['PENDING', 'ASSIGNED', 'CHECKED_IN'] },
        },
      });
      if (currentBookingCount >= workSchedule.shift.maximumSlot) {
        warning = 'This shift is currently busy; you may experience some delays';
      }
    }

    const createdBooking = await this.prismaService.booking.create({
      data: {
        bookingDate,
        shiftId: workSchedule.shiftId,
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

    return {
      booking: plainToInstance(BookingDTO, createdBooking),
      warning,
    };
  }

  async getBookingById(bookingId: string, user: JWT_Payload) {
    switch (user.role) {
      case AccountRole.CUSTOMER:
        return await this.customerBookingService.getBookingById(bookingId, user.sub);
      case AccountRole.TECHNICIAN:
        return await this.technicianBookingService.getBookingById(bookingId);
      case AccountRole.STAFF:
        return await this.staffBookingService.getBookingById(bookingId);
      case AccountRole.ADMIN:
        return await this.adminBookingService.getBookingById(bookingId);
      default:
        throw new BadRequestException('Invalid user role');
    }
  }

  private transformBookingByRole(booking: any, role: AccountRole) {
    switch (role) {
      case AccountRole.CUSTOMER:
        return plainToInstance(BookingDTO, booking, {
          excludeExtraneousValues: true,
        });

      case AccountRole.STAFF:
        return plainToInstance(StaffBookingDTO, booking, {
          excludeExtraneousValues: true,
        });

      case AccountRole.ADMIN:
      default:
        return plainToInstance(BookingDTO, booking, {
          excludeExtraneousValues: true,
        });
    }
  }

  async getBookings(
    filterOptions: BookingQueryDTO,
    user: JWT_Payload
  ): Promise<PaginationResponse<BookingDTO | StaffBookingDTO>> {
    const {
      search,
      status,
      bookingDate,
      centerId,
      shiftId,
      page = 1,
      pageSize = 10,
      orderBy = 'desc',
      sortBy = 'createdAt',
      fromDate,
      toDate,
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
      ...(fromDate && {
        bookingDate: {
          gte: dateFns.startOfDay(fromDate),
        },
      }),
      ...(toDate && {
        bookingDate: {
          lte: dateFns.endOfDay(toDate),
        },
      }),
      ...buildBookingSearch(search),
    };

    switch (user.role) {
      case AccountRole.CUSTOMER:
        where.customer = {
          accountId: user.sub,
        };
        break;
      case AccountRole.STAFF:
        return this.staffBookingService.getBookings(filterOptions, user);
      case AccountRole.ADMIN:
      default:
        break;
    }

    const [totalItems, bookings] = await this.prismaService.$transaction([
      this.prismaService.booking.count({ where }),
      this.prismaService.booking.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: buildBookingOrderBy(sortBy, orderBy),
        include: {
          customer: {
            include: { account: true },
          },
          vehicle: {
            include: { vehicleModel: { include: { brand: true } } },
          },
          serviceCenter: true,
          shift: true,
          bookingDetails: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: bookings.map(booking => this.transformBookingByRole(booking, user.role)),
      page,
      pageSize,
      total: totalItems,
      totalPages,
    };
  }

  async cancelBooking(bookingId: string, user: JWT_Payload): Promise<BookingDTO> {
    const booking = await this.prismaService.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });

    if (booking.status === BookingStatus.CANCELLED)
      throw new BadRequestException('Booking is already cancelled');

    if (booking.status !== BookingStatus.PENDING)
      throw new BadRequestException('Only pending bookings can be cancelled');

    if (user.role === AccountRole.CUSTOMER && booking.customerId !== user.sub)
      throw new BadRequestException('You can only cancel your own bookings');

    const updatedBooking = await this.prismaService.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    return plainToInstance(BookingDTO, updatedBooking, { excludeExtraneousValues: true });
  }

  async updateBooking(
    bookingId: string,
    body: CustomerUpdateBookingDTO | StaffUpdateBookingDTO | AdminUpdateBookingDTO,
    user: JWT_Payload
  ) {
    switch (user.role) {
      case AccountRole.CUSTOMER:
        const updatedBody = plainToInstance(CustomerUpdateBookingDTO, body);
        return this.customerBookingService.updateBooking(bookingId, user.sub, updatedBody);
      case AccountRole.STAFF:
        const staffBody = plainToInstance(StaffUpdateBookingDTO, body);
        return this.staffBookingService.updateBooking(bookingId, staffBody);
      case AccountRole.ADMIN:
        const updatedAdminBody = plainToInstance(AdminUpdateBookingDTO, body);
        return this.adminBookingService.updateBooking(bookingId, updatedAdminBody);
      default:
        throw new BadRequestException('Invalid user role');
    }
  }
}
