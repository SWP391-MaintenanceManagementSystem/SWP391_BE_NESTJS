import { BadRequestException, Injectable } from '@nestjs/common';
import { CustomerUpdateBookingDTO } from './dto/customer-update-booking.dto';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay } from 'date-fns/startOfDay';
import { endOfDay } from 'date-fns/endOfDay';
import { CustomerBookingDetailDTO } from './dto/customer-booking-detail.dto';
import { plainToInstance } from 'class-transformer';
import { BookingDetailService } from '../booking-detail/booking-detail.service';
import { localTimeToDate, parseDate } from 'src/utils';
import * as dateFns from 'date-fns';
@Injectable()
export class CustomerBookingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bookingDetailService: BookingDetailService
  ) {}
  async updateBooking(bookingId: string, customerId: string, updateData: CustomerUpdateBookingDTO) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: { shift: { select: { centerId: true } } },
    });

    if (!booking) throw new BadRequestException('Booking not found');
    if (booking.customerId !== customerId)
      throw new BadRequestException('You can only update your own bookings');
    if (booking.status !== 'PENDING')
      throw new BadRequestException('Only pending bookings can be updated');

    const updatePayload = {
      note: updateData.note ?? booking.note,
      bookingDate: booking.bookingDate,
      shiftId: booking.shiftId,
      vehicleId: booking.vehicleId,
      totalCost: booking.totalCost,
    };
    if (updateData.bookingDate) {
      const parsedBookingDate = parseDate(updateData.bookingDate);
      if (!parsedBookingDate) {
        throw new BadRequestException('Invalid booking date format');
      }

      // Only update if the date actually changed
      if (parsedBookingDate.getTime() !== booking.bookingDate.getTime()) {
        const bookingTime = dateFns.format(updateData.bookingDate, 'HH:mm:ss');
        const bookingTimeAsDate = localTimeToDate(bookingTime);
        const workSchedule = await this.prismaService.workSchedule.findFirst({
          where: {
            date: {
              gte: startOfDay(parsedBookingDate),
              lt: endOfDay(parsedBookingDate),
            },
            shift: {
              centerId: booking.shift.centerId,
              status: 'ACTIVE',
              startTime: { lte: bookingTimeAsDate },
              endTime: { gt: bookingTimeAsDate },
            },
          },
          select: { shiftId: true },
        });

        if (!workSchedule) throw new BadRequestException('No matching shift for the selected date');

        updatePayload.bookingDate = parsedBookingDate;
        updatePayload.shiftId = workSchedule.shiftId;
      }
    }

    if (updateData.vehicleId && updateData.vehicleId !== booking.vehicleId) {
      const existingBooking = await this.prismaService.booking.findFirst({
        where: {
          vehicleId: updateData.vehicleId,
          shiftId: updatePayload.shiftId,
          status: { in: ['PENDING', 'ASSIGNED', 'CHECKED_IN'] },
          NOT: { id: bookingId },
        },
      });

      if (existingBooking) {
        throw new BadRequestException(
          'This vehicle is already booked for the selected date and time'
        );
      }

      updatePayload.vehicleId = updateData.vehicleId;
    }

    if (updateData.serviceIds || updateData.packageIds) {
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

    return this.getBookingById(bookingId, customerId);
  }

  async getBookingById(bookingId: string, userId: string) {
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
    if (booking.customer.accountId !== userId) {
      throw new BadRequestException('You can only access your own bookings');
    }

    return plainToInstance(CustomerBookingDetailDTO, booking, { excludeExtraneousValues: true });
  }
}
