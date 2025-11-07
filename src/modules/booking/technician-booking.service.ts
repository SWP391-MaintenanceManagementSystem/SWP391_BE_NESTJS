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
import { BookingDTO } from './dto/booking.dto';
import { buildBookingSearch } from 'src/common/search/search.util';

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
      ...(search && buildBookingSearch(search)),
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
      include: {
        customer: { select: { accountId: true } },
      },
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

  async markInprogressTasks(
    bookingId: string,
    user: JWT_Payload
  ): Promise<{ data: BookingDTO; customerId: string; staffIds: string[] }> {
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
    // Update booking status
    const updated = await this.prismaService.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.IN_PROGRESS },
      include: {
        customer: {
          select: { accountId: true, firstName: true, lastName: true },
        },
        bookingAssignments: {
          select: { assignedBy: true },
        },
      },
    });

    const bookingDTO = plainToInstance(BookingDTO, updated, {
      excludeExtraneousValues: true,
    });

    // 1. Lấy tất cả assignedBy (staff)
    const assignedByIds = [...new Set(updated.bookingAssignments.map(a => a.assignedBy))];

    // 2. Lọc: chỉ giữ staff đang trong ca hôm đó
    const bookingDateOnly = dateFns.startOfDay(updated.bookingDate);

    const workSchedules = await this.prismaService.workSchedule.findMany({
      where: {
        employeeId: { in: assignedByIds },
        shiftId: updated.shiftId,
        date: {
          gte: bookingDateOnly,
          lt: dateFns.endOfDay(bookingDateOnly),
        },
        employee: {
          workCenters: {
            some: {
              centerId: updated.centerId,
              startDate: { lte: bookingDateOnly },
              OR: [{ endDate: null }, { endDate: { gte: bookingDateOnly } }],
            },
          },
        },
      },
      select: { employeeId: true },
    });

    const staffIds = workSchedules.map(ws => ws.employeeId); // ← STAFF trong ca

    return {
      data: bookingDTO,
      customerId: updated.customer.accountId,
      staffIds, // ← Gửi cho STAFF (assignedBy) trong ca
    };
  }

  async getTechnicianCurrentBooking(technicianId: string) {
    const booking = await this.prismaService.booking.findFirst({
      where: {
        bookingAssignments: {
          some: {
            employeeId: technicianId,
          },
        },
        status: {
          in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS],
        },
      },
      orderBy: { bookingDate: 'asc' },
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
      return null;
    }

    return plainToInstance(TechnicianBookingDetailDTO, booking, { excludeExtraneousValues: true });
  }
}
