import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay } from 'date-fns/startOfDay';
import { endOfDay } from 'date-fns/endOfDay';
import { AdminUpdateBookingDTO } from './dto/admin-update-booking.dto';
import { AdminBookingDetailDTO } from './dto/admin-booking-detail.dto';
import { plainToInstance } from 'class-transformer';
import { parseDate } from 'src/utils';

@Injectable()
export class AdminBookingService {
  constructor(private readonly prismaService: PrismaService) {}
  async updateBooking(bookingId: string, updateData: AdminUpdateBookingDTO) {
    const booking = await this.prismaService.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new BadRequestException('Booking not found');

    const notAllowed = ['COMPLETED', 'CANCELLED'];
    if (notAllowed.includes(booking.status)) {
      throw new BadRequestException(`Cannot update bookings that are ${notAllowed.join(' or ')}`);
    }

    let shiftId = booking.shiftId;
    let bookingDate = booking.bookingDate;
    let vehicleId = booking.vehicleId;

    if (updateData.bookingDate) {
      // Convert string date to Date object
      const parsedBookingDate = parseDate(updateData.bookingDate);
      if (!parsedBookingDate) {
        throw new BadRequestException('Invalid booking date format');
      }

      // Only update if the date actually changed
      if (parsedBookingDate.getTime() !== booking.bookingDate.getTime()) {
        const centerId = updateData.centerId ?? booking.centerId;
        const workSchedule = await this.prismaService.workSchedule.findFirst({
          where: {
            date: {
              gte: startOfDay(parsedBookingDate),
              lt: endOfDay(parsedBookingDate),
            },
            shift: {
              centerId,
              status: 'ACTIVE',
              startTime: { lte: parsedBookingDate },
              endTime: { gt: parsedBookingDate },
            },
          },
          include: { shift: true },
        });
        if (!workSchedule)
          throw new BadRequestException('No matching shift for the selected date and center');

        shiftId = workSchedule.shiftId;
        bookingDate = parsedBookingDate;
      }
    }

    if (updateData.vehicleId) vehicleId = updateData.vehicleId;

    const existingBooking = await this.prismaService.booking.findFirst({
      where: {
        vehicleId,
        shiftId,
        status: { in: ['PENDING', 'ASSIGNED', 'CHECKED_IN'] },
        NOT: { id: bookingId },
      },
    });
    if (existingBooking)
      throw new BadRequestException('This vehicle is already booked for the selected shift');

    const updatedBooking = await this.prismaService.booking.update({
      where: { id: bookingId },
      data: {
        note: updateData.note ?? booking.note,
        bookingDate,
        shiftId,
        vehicleId,
        totalCost: updateData.totalCost ?? booking.totalCost,
        status: updateData.status ?? booking.status,
      },
    });
    return updatedBooking;
  }

  async getBookingById(bookingId: string): Promise<AdminBookingDetailDTO> {
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

    return plainToInstance(AdminBookingDetailDTO, booking, { excludeExtraneousValues: true });
  }
}
