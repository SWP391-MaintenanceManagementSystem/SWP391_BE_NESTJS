import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import * as dateFns from 'date-fns';
import { TechnicianBookingQueryDTO } from './dto/technician-booking-query.dto';
import { TechnicianBookingDTO } from './dto/technician-booking.dto';
import { TechnicianBookingDetailDTO } from './dto/technician-booking-detail.dto';
import { buildBookingOrderBy } from 'src/common/sort/sort.util';
import { parseDate, utcToVNDate } from 'src/utils';
import { JWT_Payload } from 'src/common/types';
import { BookingDetailService } from '../booking-detail/booking-detail.service';

@Injectable()
export class TechnicianBookingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bookingDetailService: BookingDetailService
  ) {}

  private buildTechnicianBookingWhere(
    technicianId: string,
    filter: TechnicianBookingQueryDTO
  ): Prisma.BookingWhereInput {
    const { status, search, fromDate, toDate, centerId } = filter;

    const dateFilter: Prisma.BookingWhereInput = {};
    // Convert string dates to Date objects for database comparison
    const parsedFromDate = fromDate ? parseDate(fromDate) : null;
    const parsedToDate = toDate ? parseDate(toDate) : null;

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

    return {
      bookingAssignments: {
        some: {
          employeeId: technicianId,
        },
      },
      ...(status && { status }),
      ...(centerId && { centerId }),
      ...dateFilter,
      ...(search && {
        OR: [
          {
            customer: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { account: { email: { contains: search, mode: 'insensitive' } } },
              ],
            },
          },
          {
            vehicle: {
              OR: [
                { licensePlate: { contains: search, mode: 'insensitive' } },
                { vin: { contains: search, mode: 'insensitive' } },
                {
                  vehicleModel: {
                    OR: [
                      { name: { contains: search, mode: 'insensitive' } },
                      { brand: { name: { contains: search, mode: 'insensitive' } } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      }),
    };
  }

  private readonly bookingInclude = {
    customer: { include: { account: true } },
    vehicle: {
      include: {
        vehicleModel: { include: { brand: true } },
      },
    },
    serviceCenter: true,
    shift: true,
    bookingAssignments: {
      include: {
        employee: { include: { account: true } },
        assigner: { include: { account: true } },
      },
    },
    bookingDetails: {
      include: {
        service: true,
        package: true,
      },
    },
  };

  async getTechnicianBookings(
    technicianId: string,
    options: TechnicianBookingQueryDTO
  ): Promise<PaginationResponse<TechnicianBookingDTO>> {
    const { page = 1, pageSize = 10, sortBy = 'bookingDate', orderBy = 'desc' } = options;

    const where = this.buildTechnicianBookingWhere(technicianId, options);

    const [totalItems, bookings] = await this.prismaService.$transaction([
      this.prismaService.booking.count({ where }),
      this.prismaService.booking.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: buildBookingOrderBy(sortBy, orderBy),
        include: this.bookingInclude,
      }),
    ]);

    const formattedBookings = bookings.map(booking => {
      const assignerAssignment = booking.bookingAssignments.find(
        ba => ba.employeeId === technicianId
      );
      const assigner = assignerAssignment?.assigner
        ? {
            firstName: assignerAssignment.assigner.firstName,
            lastName: assignerAssignment.assigner.lastName,
            email: assignerAssignment.assigner.account.email,
          }
        : null;

      return {
        ...booking,
        assigner,
      };
    });

    return {
      data: plainToInstance(TechnicianBookingDTO, formattedBookings, {
        excludeExtraneousValues: true,
      }),
      page,
      pageSize,
      total: totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    };
  }

  async getBookingById(bookingId: string): Promise<TechnicianBookingDetailDTO> {
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

    return plainToInstance(TechnicianBookingDetailDTO, booking, { excludeExtraneousValues: true });
  }

  async markCompleteTasks(
    bookingId: string,
    user: JWT_Payload,
    detailIds: string[]
  ): Promise<{ data: any; customerId: string; staffIds: string[] }> {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingAssignments: {
          where: { employeeId: user.sub },
        },
        customer: { select: { accountId: true } },
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.bookingAssignments.length === 0) {
      throw new BadRequestException('You are not assigned to this booking');
    }

    await this.bookingDetailService.markCompleteDetails(bookingId, detailIds);
    const updatedBooking = await this.prismaService.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' },
    });

    const vnBookingDate = utcToVNDate(updatedBooking.bookingDate);
    const vnDateOnly = new Date(
      vnBookingDate.getFullYear(),
      vnBookingDate.getMonth(),
      vnBookingDate.getDate()
    );

    const staffSchedules = await this.prismaService.workSchedule.findMany({
      where: {
        shiftId: updatedBooking.shiftId,
        date: {
          gte: dateFns.startOfDay(vnDateOnly),
          lt: dateFns.endOfDay(vnDateOnly),
        },
        employee: {
          account: {
            role: 'STAFF',
            status: 'VERIFIED',
          },
          workCenters: {
            some: {
              centerId: updatedBooking.centerId,
              startDate: { lte: vnDateOnly },
              OR: [{ endDate: null }, { endDate: { gte: vnDateOnly } }],
            },
          },
        },
      },
      select: {
        employeeId: true,
      },
    });

    const staffIds = staffSchedules.map(s => s.employeeId);

    return {
      data: updatedBooking,
      customerId: booking.customer.accountId,
      staffIds,
    };
  }

  async markInprogressTasks(bookingId: string, user: JWT_Payload): Promise<void> {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingAssignments: {
          where: { employeeId: user.sub },
        },
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.bookingAssignments.length === 0) {
      throw new BadRequestException('You are not assigned to this booking');
    }

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new BadRequestException('Can not start tasks for this booking now');
    }

    await this.bookingDetailService.markInprogressDetails(bookingId);
    await this.prismaService.booking.update({
      where: { id: bookingId },
      data: { status: 'IN_PROGRESS' },
    });
  }
}
