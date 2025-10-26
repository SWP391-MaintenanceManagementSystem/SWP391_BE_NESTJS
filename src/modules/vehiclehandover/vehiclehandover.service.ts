import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateVehicleHandoverDTO } from './dto/create-vehiclehandover.dto';
import { UpdateVehicleHandoverDTO } from './dto/update-vehiclehandover.dto';
import { VehicleHandoverDTO } from './dto/vehiclehandover.dto';
import { VehicleHandoverQueryDTO } from './dto/vehiclehandover-query.dto';
import { plainToInstance } from 'class-transformer';
import { BookingStatus, Prisma } from '@prisma/client';
import { parseDate, vnToUtcDate } from 'src/utils';

@Injectable()
export class VehicleHandoverService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateVehicleHandoverDTO, staffId: string): Promise<VehicleHandoverDTO> {
    const { bookingId, odometer, note, description, date } = createDto;

    // --- Validate and convert date ---
    const parsedDate = parseDate(date);
    if (!parsedDate) {
      throw new BadRequestException('Invalid handover date');
    }
    const utcDate = vnToUtcDate(parsedDate);

    // --- Validate booking existence & state ---
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { handover: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    if (booking.handover) {
      throw new ConflictException(`Vehicle handover already exists for booking ${bookingId}`);
    }

    if (booking.status !== BookingStatus.ASSIGNED) {
      throw new BadRequestException(
        `Booking must be in ASSIGNED status to create handover. Current status: ${booking.status}`
      );
    }

    // --- Create handover & update booking atomically ---
    const handover = await this.prisma.$transaction(async tx => {
      const newHandover = await tx.vehicleHandover.create({
        data: {
          bookingId,
          odometer,
          note,
          description: Array.isArray(description) ? description.join(', ') : description,
          staffId,
          date: utcDate,
        },
        include: {
          staff: {
            include: { account: true },
          },
          booking: true,
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CHECKED_IN },
      });

      return newHandover;
    });

    return plainToInstance(VehicleHandoverDTO, handover, {
      excludeExtraneousValues: true,
    });
  }

  async getVehicleHandovers(query: VehicleHandoverQueryDTO): Promise<{
    data: VehicleHandoverDTO[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { page = 1, pageSize = 10, bookingId, staffId, dateFrom, dateTo } = query;

    const where: Prisma.VehicleHandoverWhereInput = {
      ...(bookingId && { bookingId }),
      ...(staffId && { staffId }),
      ...(dateFrom || dateTo
        ? {
            date: {
              gte: dateFrom ? new Date(dateFrom) : undefined,
              lte: dateTo ? new Date(dateTo) : undefined,
            },
          }
        : {}),
    };

    const [handovers, total] = await Promise.all([
      this.prisma.vehicleHandover.findMany({
        where,
        include: {
          staff: { include: { account: true } },
          booking: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.vehicleHandover.count({ where }),
    ]);

    return {
      data: handovers.map(h =>
        plainToInstance(VehicleHandoverDTO, h, { excludeExtraneousValues: true })
      ),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getVehicleHandoverById(id: string): Promise<VehicleHandoverDTO> {
    const handover = await this.prisma.vehicleHandover.findUnique({
      where: { id },
      include: {
        staff: { include: { account: true } },
        booking: {
          include: {
            vehicle: {
              include: {
                vehicleModel: { include: { brand: true } },
              },
            },
            customer: { include: { account: true } },
          },
        },
      },
    });

    if (!handover) {
      throw new NotFoundException(`Vehicle handover with ID ${id} not found`);
    }

    return plainToInstance(VehicleHandoverDTO, handover, {
      excludeExtraneousValues: true,
    });
  }

  async findByBookingId(bookingId: string): Promise<VehicleHandoverDTO | null> {
    const handover = await this.prisma.vehicleHandover.findUnique({
      where: { bookingId },
      include: {
        staff: { include: { account: true } },
        booking: true,
      },
    });

    if (!handover) return null;

    return plainToInstance(VehicleHandoverDTO, handover, {
      excludeExtraneousValues: true,
    });
  }

  async updateVehicleHandover(
    id: string,
    updateDto: UpdateVehicleHandoverDTO
  ): Promise<VehicleHandoverDTO> {
    const existing = await this.prisma.vehicleHandover.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Vehicle handover with ID ${id} not found`);
    }

    const { description, date, ...rest } = updateDto;

    // Handle date conversion if provided
    let utcDate: Date | undefined = undefined;
    if (date) {
      const parsedDate = parseDate(date);
      if (!parsedDate) {
        throw new BadRequestException('Invalid handover date');
      }
      utcDate = vnToUtcDate(parsedDate);
    }

    const updatedHandover = await this.prisma.vehicleHandover.update({
      where: { id },
      data: {
        ...rest,
        ...(utcDate && { date: utcDate }),
        description: Array.isArray(description) ? description.join(', ') : description,
      },
      include: {
        staff: { include: { account: true } },
        booking: true,
      },
    });

    return plainToInstance(VehicleHandoverDTO, updatedHandover, {
      excludeExtraneousValues: true,
    });
  }

  async deleteVehicleHandover(id: string): Promise<void> {
    const handover = await this.prisma.vehicleHandover.findUnique({ where: { id } });
    if (!handover) {
      throw new NotFoundException(`Vehicle handover with ID ${id} not found`);
    }

    await this.prisma.vehicleHandover.delete({ where: { id } });
  }
}
