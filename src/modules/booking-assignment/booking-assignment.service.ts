import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountRole, BookingStatus } from '@prisma/client';
import { CreateBookingAssignmentsDTO } from './dto/create-booking-assignments.dto';
import { plainToInstance } from 'class-transformer';
import { BookingAssignmentsDTO } from './dto/booking-assignments.dto';
import { CustomerBookingAssignmentsDTO } from './dto/customer-booking-assigments.dto';
import { StaffBookingAssignmentDTO } from './dto/staff-booking-assignments.dto';
import { JWT_Payload } from 'src/common/types';

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
    const validBookingStatuses: BookingStatus[] = [
      BookingStatus.ASSIGNED,
      BookingStatus.CHECKED_IN,
      BookingStatus.PENDING,
    ];
    if (!validBookingStatuses.includes(booking.status)) {
      throw new BadRequestException('Booking cannot assign technicians at this time.');
    }

    const employees = await this.prismaService.employee.findMany({
      where: { accountId: { in: employeeIds } },
      include: { account: true, workSchedules: true },
    });

    const missingEmployees = employeeIds.filter(id => !employees.find(e => e.accountId === id));
    if (missingEmployees.length) {
      throw new BadRequestException({
        message: 'Some employees were not found',
        errors: missingEmployees.map(id => `Employee with accountId ${id} was not found`),
      });
    }

    const nonTechnicians = employees.filter(e => e.account.role !== AccountRole.TECHNICIAN);
    if (nonTechnicians.length) {
      throw new BadRequestException({
        message: 'Some employees are not technicians',
        errors: nonTechnicians.map(e => `Employee ${e.accountId} is not a technician`),
      });
    }

    const notInShift = employees.filter(
      e => !e.workSchedules.some(ws => ws.shiftId === booking.shiftId)
    );
    if (notInShift.length) {
      throw new BadRequestException({
        message: 'Some employees are not assigned to the booking shift',
        errors: notInShift.map(
          e => `Employee ${e.accountId} is not assigned to the booking's shift`
        ),
      });
    }

    const ONGOING_BOOKING_STATUSES = [
      BookingStatus.ASSIGNED,
      BookingStatus.CHECKED_IN,
      BookingStatus.IN_PROGRESS,
    ];

    const ongoingBookings = await this.prismaService.bookingAssignment.findMany({
      where: {
        employeeId: { in: employeeIds },
        booking: {
          status: { in: ONGOING_BOOKING_STATUSES },
          shiftId: booking.shiftId,
        },
      },
    });
    const busyEmployees = ongoingBookings.map(b => b.employeeId);
    if (busyEmployees.length) {
      throw new BadRequestException({
        message: 'Some employees already have ongoing bookings',
        errors: busyEmployees.map(id => `Employee with accountId ${id} is busy during this shift`),
      });
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

    const bookingAssignments = assignments.map(a => ({
      id: a.id,
      booking: a.booking,
      employee: {
        id: a.employee.accountId,
        role: a.employee.account.role,
        firstName: a.employee.firstName,
        lastName: a.employee.lastName,
        email: a.employee.account.email,
        phoneNumber: a.employee.account.phone,
        avatar: a.employee.account.avatar,
      },
      assigner: a.assigner
        ? {
            id: a.assigner.accountId,
            role: a.assigner.account.role,
            firstName: a.assigner.firstName,
            lastName: a.assigner.lastName,
            email: a.assigner.account.email,
            phoneNumber: a.assigner.account.phone,
            avatar: a.assigner.account.avatar,
          }
        : null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    return plainToInstance(BookingAssignmentsDTO, bookingAssignments);
  }

  async getAssignmentsForCustomer(
    bookingId: string,
    customerId: string
  ): Promise<CustomerBookingAssignmentsDTO[]> {
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, customerId: true },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found.');
    }

    if (booking.customerId !== customerId) {
      throw new ForbiddenException('You are not allowed to view this booking.');
    }

    const assignments = await this.prismaService.bookingAssignment.findMany({
      where: { bookingId },
      include: {
        employee: { include: { account: true } },
        assigner: { include: { account: true } },
        booking: true,
      },
    });

    const customerAssignments = assignments.map(a => ({
      id: a.id,
      booking: a.booking,
      employee: {
        id: a.employee.accountId,
        role: a.employee.account.role,
        firstName: a.employee.firstName,
        lastName: a.employee.lastName,
        email: a.employee.account.email,
        phoneNumber: a.employee.account.phone,
        avatar: a.employee.account.avatar,
      },
    }));

    return plainToInstance(CustomerBookingAssignmentsDTO, customerAssignments);
  }

  async getAssignmentsForStaff(
    bookingId: string,
    staff: JWT_Payload
  ): Promise<StaffBookingAssignmentDTO[]> {
    const existedStaff = await this.prismaService.employee.findUnique({
      where: { accountId: staff.sub },
      select: {
        accountId: true,
        workCenters: {
          where: { endDate: null },
          select: { centerId: true },
        },
      },
    });

    if (!existedStaff) {
      throw new ForbiddenException('You are not allowed to view this booking.');
    }

    if (existedStaff.workCenters.length === 0) {
      throw new ForbiddenException('You are not currently assigned to any center.');
    }

    const assignments = await this.prismaService.bookingAssignment.findMany({
      where: {
        bookingId,
        booking: {
          centerId: { in: existedStaff.workCenters.map(wc => wc.centerId) },
        },
      },
      include: {
        employee: { include: { account: true } },
        assigner: { include: { account: true } },
        booking: true,
      },
    });
    const staffAssignments = assignments.map(a => ({
      id: a.id,
      booking: a.booking,
      employee: {
        id: a.employee.accountId,
        firstName: a.employee.firstName,
        lastName: a.employee.lastName,
        email: a.employee.account.email,
        phoneNumber: a.employee.account.phone,
        avatar: a.employee.account.avatar,
      },
      assignedBy: a.assigner ? `${a.assigner.firstName} ${a.assigner.lastName}` : null,
    }));

    return plainToInstance(StaffBookingAssignmentDTO, staffAssignments);
  }

  async deleteAssignment(assignmentId: string, staff: JWT_Payload) {
    const existingStaff = await this.prismaService.employee.findUnique({
      where: { accountId: staff.sub },
      select: {
        accountId: true,
        workCenters: { select: { centerId: true, endDate: true } },
      },
    });

    if (!existingStaff) {
      throw new ForbiddenException('You are not allowed to delete this assignment.');
    }

    const activeCenterIds = existingStaff.workCenters
      .filter(wc => wc.endDate === null)
      .map(wc => wc.centerId);

    const assignment = await this.prismaService.bookingAssignment.findFirst({
      where: {
        id: assignmentId,
        booking: { centerId: { in: activeCenterIds } },
      },
    });

    if (!assignment) {
      throw new BadRequestException('Assignment not found or not in your center.');
    }

    await this.prismaService.bookingAssignment.delete({
      where: { id: assignmentId },
    });

    return { message: 'Technician assignment deleted successfully.' };
  }
}
