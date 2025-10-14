import { BadRequestException, Injectable } from '@nestjs/common';
import { CustomerUpdateBookingDTO } from './dto/customer-update-booking.dto';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay } from 'date-fns/startOfDay';
import { endOfDay } from 'date-fns/endOfDay';

@Injectable()
export class CustomerBookingService {
  constructor(private readonly prismaService: PrismaService) {}

  async updateBooking(bookingId: string, customerId: string, updateData: CustomerUpdateBookingDTO) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new BadRequestException('Booking not found');
    if (booking.customerId !== customerId)
      throw new BadRequestException('You can only update your own bookings');
    if (booking.status !== 'PENDING')
      throw new BadRequestException('Only pending bookings can be updated');

    let shiftId = booking.shiftId;
    let bookingDate = booking.bookingDate;
    let vehicleId = booking.vehicleId;

    if (updateData.bookingDate && updateData.bookingDate !== booking.bookingDate) {
      const workSchedule = await this.prismaService.workSchedule.findFirst({
        where: {
          date: {
            gte: startOfDay(updateData.bookingDate),
            lt: endOfDay(updateData.bookingDate),
          },
          shift: {
            centerId: booking.centerId,
            status: 'ACTIVE',
            startTime: { lte: updateData.bookingDate },
            endTime: { gt: updateData.bookingDate },
          },
        },
        include: { shift: true },
      });
      if (!workSchedule) throw new BadRequestException('No matching shift for the selected date');
      shiftId = workSchedule.shiftId;
      bookingDate = updateData.bookingDate;
    }

    if (updateData.vehicleId && updateData.vehicleId !== booking.vehicleId) {
      vehicleId = updateData.vehicleId;

      const existingBooking = await this.prismaService.booking.findFirst({
        where: {
          vehicleId,
          shiftId,
          status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
          NOT: { id: bookingId },
        },
      });

      if (existingBooking) {
        throw new BadRequestException(
          'This vehicle is already booked for the selected date and time'
        );
      }
    }

    const updatedBooking = await this.prismaService.booking.update({
      where: { id: bookingId },
      data: {
        note: updateData.note ?? booking.note,
        bookingDate,
        shiftId,
        vehicleId,
      },
    });

    return updatedBooking;
  }
}
