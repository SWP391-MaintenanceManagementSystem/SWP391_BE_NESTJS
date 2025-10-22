import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay } from 'date-fns/startOfDay';
import { endOfDay } from 'date-fns/endOfDay';
import { AdminUpdateBookingDTO } from './dto/admin-update-booking.dto';

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

    if (updateData.bookingDate && updateData.bookingDate !== booking.bookingDate) {
      const centerId = updateData.centerId ?? booking.centerId;
      const workSchedule = await this.prismaService.workSchedule.findFirst({
        where: {
          date: { gte: startOfDay(updateData.bookingDate), lt: endOfDay(updateData.bookingDate) },
          shift: {
            centerId,
            status: 'ACTIVE',
            startTime: { lte: updateData.bookingDate },
            endTime: { gt: updateData.bookingDate },
          },
        },
        include: { shift: true },
      });
      if (!workSchedule)
        throw new BadRequestException('No matching shift for the selected date and center');

      shiftId = workSchedule.shiftId;
      bookingDate = updateData.bookingDate;
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
}
