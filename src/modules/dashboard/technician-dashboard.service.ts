import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountRole, BookingStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { TechnicianDashboardOverviewDTO } from './dto/technician-dashboard-overview.dto';

@Injectable()
export class TechnicianDashboardService {
  constructor(private readonly prismaService: PrismaService) {}
  async getBookingStatisticsByTechnician(
    technicianId: string
  ): Promise<TechnicianDashboardOverviewDTO> {
    const technician = await this.prismaService.account.findUnique({
      where: { id: technicianId },
      select: { role: true },
    });

    if (!technician || technician.role !== AccountRole.TECHNICIAN) {
      throw new NotFoundException(`Technician with ID ${technicianId} not found`);
    }

    const assignments = await this.prismaService.bookingAssignment.findMany({
      where: {
        employeeId: technicianId,
      },
      select: {
        booking: {
          select: { status: true },
        },
      },
    });

    const stats = {
      [BookingStatus.COMPLETED]: 0,
      [BookingStatus.IN_PROGRESS]: 0,
      [BookingStatus.PENDING]: 0,
      [BookingStatus.ASSIGNED]: 0,
      [BookingStatus.CHECKED_IN]: 0,
      [BookingStatus.CHECKED_OUT]: 0,
      [BookingStatus.CANCELLED]: 0,
    };

    assignments.forEach(assign => {
      const status = assign.booking.status;
      stats[status] = (stats[status] || 0) + 1;
    });

    const totalBookings = assignments.length;

    const completed = stats[BookingStatus.COMPLETED] + stats[BookingStatus.CHECKED_OUT] || 0;
    const inProgress = stats[BookingStatus.IN_PROGRESS] || 0;
    const pending =
      stats[BookingStatus.PENDING] +
      stats[BookingStatus.ASSIGNED] +
      stats[BookingStatus.CHECKED_IN];

    const completionRate = totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0;

    return plainToInstance(TechnicianDashboardOverviewDTO, {
      totalBookings,
      completed,
      inProgress,
      pending,
      completionRate,
    });
  }
}
