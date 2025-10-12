import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountRole, BookingStatus } from '@prisma/client';
import { CreateBookingAssignmentsDTO } from './dto/create-booking-assignments.dto';
import { plainToInstance } from 'class-transformer';
import { BookingAssignmentsDTO } from './dto/booking-assignments.dto';

@Injectable()
export class BookingAssignmentService {
  constructor(private readonly prismaService: PrismaService) {}
  async assignTechniciansToBooking(body: CreateBookingAssignmentsDTO, staffId: string) {
    const { bookingId, employeeIds } = body;

    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: { shift: true },
    });
    if (!booking) throw new BadRequestException('Booking not found.');
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Booking must be confirmed before assignment.');
    }

    const employees = await this.prismaService.employee.findMany({
      where: { accountId: { in: employeeIds } },
      include: { account: true, workSchedules: true },
    });

    const missingEmployees = employeeIds.filter(id => !employees.find(e => e.accountId === id));
    if (missingEmployees.length) {
      throw new BadRequestException(`Employees not found: ${missingEmployees.join(', ')}`);
    }

    const nonTechnicians = employees.filter(e => e.account.role !== AccountRole.TECHNICIAN);
    if (nonTechnicians.length) {
      throw new BadRequestException(
        `These employees are not technicians: ${nonTechnicians.map(e => e.accountId).join(', ')}`
      );
    }

    const notInShift = employees.filter(
      e => !e.workSchedules.some(ws => ws.shiftId === booking.shiftId)
    );
    if (notInShift.length) {
      throw new BadRequestException(
        `These employees are not assigned to the booking's shift: ${notInShift.map(e => e.accountId).join(', ')}`
      );
    }

    const ONGOING_BOOKING_STATUSES = [
      BookingStatus.CONFIRMED,
      BookingStatus.CHECKED_IN,
      BookingStatus.IN_PROGRESS,
    ];

    const ongoingBookings = await this.prismaService.bookingAssignment.findMany({
      where: {
        employeeId: { in: employeeIds },
        booking: { status: { in: ONGOING_BOOKING_STATUSES } },
      },
    });
    const busyEmployees = ongoingBookings.map(b => b.employeeId);
    if (busyEmployees.length) {
      throw new BadRequestException(
        `Employees already have ongoing bookings: ${busyEmployees.join(', ')}`
      );
    }

    const assignments = await this.prismaService.$transaction(async tx => {
      return Promise.all(
        employeeIds.map(employeeId =>
          tx.bookingAssignment.create({
            data: {
              bookingId,
              employeeId,
              assignedBy: staffId,
            },
            // include: {
            //   employee: { include: { account: true } },
            //   assigner: { include: { account: true } },
            //   booking: true,
            // },
          })
        )
      );
    });

    return plainToInstance(BookingAssignmentsDTO, assignments);
  }

  async getBookingAssignments(bookingId: string) {
    const assignments = await this.prismaService.bookingAssignment.findMany({
      where: { bookingId },
      include: {
        employee: { include: { account: true } },
        assigner: { include: { account: true } },
        booking: true,
      },
    });

    return plainToInstance(BookingAssignmentsDTO, assignments);
  }
}
