import { BadRequestException, Injectable } from '@nestjs/common';
import { StaffUpdateBookingDTO } from './dto/staff-update-booking.dto';
import { PrismaService } from '../prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { StaffBookingDTO } from './dto/staff-booking.dto';
import { buildBookingOrderBy } from 'src/common/sort/sort.util';
import { buildBookingSearch } from 'src/common/search/search.util';
import * as dateFns from 'date-fns';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { BookingQueryDTO } from './dto/booking-query.dto';
import { JWT_Payload } from 'src/common/types';
import { Prisma } from '@prisma/client';
import { StaffBookingDetailDTO } from './dto/staff-booking-detail.dto';
import { parseDate } from 'src/utils';
import { BookingDetailService } from '../booking-detail/booking-detail.service';
import { AccountRole, AccountStatus } from '@prisma/client';
@Injectable()
export class StaffBookingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bookingDetailService: BookingDetailService
  ) {}

  async updateBooking(
    bookingId: string,
    updateData: StaffUpdateBookingDTO,
    staffId: string
  ): Promise<{
    booking: StaffBookingDetailDTO;
    customerId: string;
    staffIds: string[];
    staff: { id: string; firstName: string; lastName: string };
  }> {
    const staffCenter = await this.prismaService.employee.findUnique({
      where: { accountId: staffId },
      select: {
        accountId: true,
        firstName: true,
        lastName: true,
        workCenters: {
          where: { endDate: null },
          select: { centerId: true },
          take: 1,
        },
      },
    });
    if (!staffCenter) {
      throw new BadRequestException('Staff not found');
    }
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId, centerId: staffCenter?.workCenters[0].centerId },
    });

    if (!booking) throw new BadRequestException('Booking not found');

    const NOT_ALLOWED_UPDATE_STATUSES = ['CHECKED_OUT'];
    if (NOT_ALLOWED_UPDATE_STATUSES.includes(booking.status)) {
      throw new BadRequestException(`Cannot update a booking that is ${booking.status}`);
    }

    const updatePayload: Prisma.BookingUpdateInput = {};

    if (updateData.status) {
      updatePayload.status = updateData.status;
    }
    const ALLOW_UPDATE_SERVICES_STATUSES = ['PENDING', 'ASSIGNED', 'CHECKED_IN'];
    if (
      (updateData.serviceIds || updateData.packageIds) &&
      ALLOW_UPDATE_SERVICES_STATUSES.includes(booking.status)
    ) {
      await this.bookingDetailService.updateBookingDetails(bookingId, {
        services: updateData.serviceIds,
        packages: updateData.packageIds,
      });

      updatePayload.totalCost = await this.bookingDetailService.calculateTotalCost(bookingId);
    }

    await this.prismaService.booking.update({
      where: { id: bookingId },
      data: updatePayload,
    });

    const staffSchedules = await this.prismaService.workSchedule.findMany({
      where: {
        shiftId: booking.shiftId,
        date: {
          gte: dateFns.startOfDay(booking.bookingDate),
          lt: dateFns.endOfDay(booking.bookingDate),
        },
        employee: {
          account: {
            role: AccountRole.STAFF,
            status: AccountStatus.VERIFIED,
          },
          workCenters: {
            some: {
              centerId: booking.centerId,
              startDate: { lte: dateFns.startOfDay(booking.bookingDate) },
              OR: [
                { endDate: null },
                { endDate: { gte: dateFns.startOfDay(booking.bookingDate) } },
              ],
            },
          },
        },
      },
      select: { employeeId: true },
    });

    const updatedBooking = await this.getBookingById(bookingId);

    return {
      booking: updatedBooking,
      customerId: booking.customerId,
      staffIds: staffSchedules.map(s => s.employeeId),
      staff: {
        id: staffCenter.accountId,
        firstName: staffCenter.firstName || 'Staff',
        lastName: staffCenter.lastName || '',
      },
    };
  }

  async getBookings(
    filterOptions: BookingQueryDTO,
    user: JWT_Payload
  ): Promise<PaginationResponse<StaffBookingDTO>> {
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
      isPremium,
    } = filterOptions;

    // Convert string dates to Date objects for database comparison
    const dateFilter: Prisma.BookingWhereInput = {};
    const parsedFromDate = fromDate ? parseDate(fromDate) : null;
    const parsedToDate = toDate ? parseDate(toDate) : null;
    const parsedBookingDate = bookingDate ? parseDate(bookingDate) : null;

    if (parsedFromDate && parsedToDate) {
      dateFilter.bookingDate = {
        gte: dateFns.startOfDay(parsedFromDate),
        lte: dateFns.endOfDay(parsedToDate),
      };
    } else if (parsedFromDate) {
      dateFilter.bookingDate = { gte: dateFns.startOfDay(parsedFromDate) };
    } else if (parsedToDate) {
      dateFilter.bookingDate = { lte: dateFns.endOfDay(parsedToDate) };
    }

    const where: Prisma.BookingWhereInput = {
      ...(status && { status }),
      ...(centerId && { centerId }),
      ...(isPremium !== undefined && { customer: { isPremium } }),
      ...(shiftId && { shiftId }),
      ...(parsedBookingDate && {
        bookingDate: {
          gte: dateFns.startOfDay(parsedBookingDate),
          lte: dateFns.endOfDay(parsedBookingDate),
        },
      }),
      ...dateFilter,
      ...buildBookingSearch(search),
    };

    const staff = await this.prismaService.employee.findUnique({
      where: { accountId: user.sub },
      select: {
        workCenters: {
          where: { endDate: null },
          select: { centerId: true },
          take: 1,
        },
      },
    });

    if (!staff) {
      throw new BadRequestException('Staff not found');
    }

    where.centerId = staff.workCenters[0].centerId;

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
      data: bookings.map(booking => plainToInstance(StaffBookingDTO, booking)),
      page,
      pageSize,
      total: totalItems,
      totalPages,
    };
  }

  async getBookingById(bookingId: string): Promise<StaffBookingDetailDTO> {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          include: { account: true },
        },
        vehicle: {
          include: { vehicleModel: { include: { brand: true } } },
        },
        serviceCenter: true,
        shift: true,
        bookingDetails: {
          include: {
            service: true,
            package: {
              include: {
                packageDetails: {
                  include: {
                    service: true,
                  },
                },
              },
            },
          },
        },
        bookingAssignments: {
          include: {
            employee: { include: { account: true } },
            assigner: { include: { account: true } },
          },
        },
      },
    });
    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    return plainToInstance(StaffBookingDetailDTO, booking, { excludeExtraneousValues: true });
  }
}
