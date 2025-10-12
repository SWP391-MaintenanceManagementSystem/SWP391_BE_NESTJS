import { BadRequestException, Injectable } from '@nestjs/common';
import { StaffUpdateBookingDTO } from './dto/staff-update-booking.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffBookingService {
  constructor(private readonly prismaService: PrismaService) {}

  async updateBooking(bookingId: string, updateData: StaffUpdateBookingDTO) {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new BadRequestException('Booking not found');
    const notAllowed = ['COMPLETED', 'CANCELLED'];
    if (notAllowed.includes(booking.status)) {
      throw new BadRequestException(`Cannot update bookings that are ${notAllowed.join(' or ')}`);
    }
    const updatedBooking = await this.prismaService.booking.update({
      where: { id: bookingId },
      data: {
        status: updateData.status ?? booking.status,
      },
    });

    return updatedBooking;
  }
}
