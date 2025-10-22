import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import * as dateFns from 'date-fns';
import { TechnicianBookingQueryDTO } from './dto/technician-booking-query.dto';
import { TechnicianBookingDTO } from './dto/technician-booking.dto';
import { TechnicianBookingDetailDTO } from './dto/technician-booking-detail.dto';

@Injectable()
export class TechnicianBookingService {
  constructor(private readonly prismaService: PrismaService) {}

  private buildTechnicianBookingWhere(
    technicianId: string,
    filter: TechnicianBookingQueryDTO
  ): Prisma.BookingWhereInput {
    const { status, search, fromDate, toDate, centerId } = filter;

    return {
      bookingAssignments: {
        some: {
          employeeId: technicianId,
        },
      },
      ...(status && { status }),
      ...(centerId && { centerId }),
      ...(fromDate && { bookingDate: { gte: dateFns.startOfDay(fromDate) } }),
      ...(toDate && { bookingDate: { lte: dateFns.endOfDay(toDate) } }),
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
        orderBy: { [sortBy]: orderBy },
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
            package: true,
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
}
