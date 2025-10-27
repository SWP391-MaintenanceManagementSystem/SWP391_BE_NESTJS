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

  async create(
    createDto: CreateVehicleHandoverDTO,
    staffAccountId: string
  ): Promise<VehicleHandoverDTO> {
    const { bookingId, odometer, note, description, date } = createDto;

    // --- Validate and convert date ---
    const parsedDate = parseDate(date);
    if (!parsedDate) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [
          {
            field: 'date',
            message: "Invalid handover date format. Expected format: yyyy-MM-dd'T'HH:mm",
          },
        ],
      });
    }

    const utcDate = vnToUtcDate(parsedDate);

    // --- Validate booking existence ---
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { handover: true },
    });

    if (!booking) {
      throw new NotFoundException({
        message: 'Validation failed',
        errors: [
          {
            field: 'bookingId',
            message: `Booking with ID ${bookingId} not found`,
          },
        ],
      });
    }

    // --- Check if handover already exists ---
    if (booking.handover) {
      throw new ConflictException({
        message: 'Validation failed',
        errors: [
          {
            field: 'bookingId',
            message: `Vehicle handover already exists for booking ${bookingId}`,
          },
        ],
      });
    }

    // --- Validate booking status ---
    if (booking.status !== BookingStatus.ASSIGNED) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [
          {
            field: 'bookingId',
            message: `Booking must be in ASSIGNED status to create handover. Current status: ${booking.status}`,
          },
        ],
      });
    }

    // --- Validate odometer reading ---
    if (odometer < 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [
          {
            field: 'odometer',
            message: 'Odometer reading must be a positive number',
          },
        ],
      });
    }

    // --- Create handover & update booking atomically ---
    const handover = await this.prisma.$transaction(async tx => {
      const newHandover = await tx.vehicleHandover.create({
        data: {
          booking: { connect: { id: bookingId } },
          staff: { connect: { accountId: staffAccountId } },
          odometer,
          note,
          description: Array.isArray(description)
            ? description
            : description
              ? [description]
              : undefined,
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

    // --- Validate pagination ---
    if (page < 1) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [
          {
            field: 'page',
            message: 'Page number must be greater than 0',
          },
        ],
      });
    }

    if (pageSize < 1 || pageSize > 100) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [
          {
            field: 'pageSize',
            message: 'Page size must be between 1 and 100',
          },
        ],
      });
    }

    // --- Validate date range ---
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [
          {
            field: 'dateFrom',
            message: 'dateFrom must be before dateTo',
          },
        ],
      });
    }

    const parsedDateFrom = dateFrom ? parseDate(dateFrom) : null;
    const parsedDateTo = dateTo ? parseDate(dateTo) : null;

    const where: Prisma.VehicleHandoverWhereInput = {
      ...(bookingId && { bookingId }),
      ...(staffId && { staffId }),
      ...(dateFrom || dateTo
        ? {
            date: {
              gte: parsedDateFrom ? vnToUtcDate(parsedDateFrom) : undefined,
              lte: parsedDateTo ? vnToUtcDate(parsedDateTo) : undefined,
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
      throw new NotFoundException({
        message: 'Validation failed',
        errors: [
          {
            field: 'id',
            message: `Vehicle handover with ID ${id} not found`,
          },
        ],
      });
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
    // --- Validate handover exists ---
    const existing = await this.prisma.vehicleHandover.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        message: 'Validation failed',
        errors: [
          {
            field: 'id',
            message: `Vehicle handover with ID ${id} not found`,
          },
        ],
      });
    }

    const { description, date, odometer, bookingId, note } = updateDto;

    // --- Validate odometer if provided ---
    if (odometer !== undefined && odometer < 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [
          {
            field: 'odometer',
            message: 'Odometer reading must be a positive number',
          },
        ],
      });
    }

    // --- Validate booking if changing ---
    if (bookingId && bookingId !== existing.bookingId) {
      const newBooking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { handover: true },
      });

      if (!newBooking) {
        throw new NotFoundException({
          message: 'Validation failed',
          errors: [
            {
              field: 'bookingId',
              message: `Booking with ID ${bookingId} not found`,
            },
          ],
        });
      }

      if (newBooking.handover && newBooking.handover.id !== id) {
        throw new ConflictException({
          message: 'Validation failed',
          errors: [
            {
              field: 'bookingId',
              message: `Booking ${bookingId} already has a handover record`,
            },
          ],
        });
      }
    }

    // --- Handle date conversion if provided ---
    let utcDate: Date | undefined = undefined;
    if (date) {
      const parsedDate = parseDate(date);
      if (!parsedDate) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: [
            {
              field: 'date',
              message: "Invalid handover date format. Expected format: yyyy-MM-dd'T'HH:mm",
            },
          ],
        });
      }
      utcDate = vnToUtcDate(parsedDate);
    }

    // --- Build update data object ---
    const updateData: Prisma.VehicleHandoverUpdateInput = {
      ...(note !== undefined && { note }),
      ...(odometer !== undefined && { odometer }),
      ...(utcDate && { date: utcDate }),
      ...(description && {
        description: Array.isArray(description) ? description : [description],
      }),
      ...(bookingId && { booking: { connect: { id: bookingId } } }),
    };

    const updatedHandover = await this.prisma.vehicleHandover.update({
      where: { id },
      data: updateData,
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
      throw new NotFoundException({
        message: 'Validation failed',
        errors: [
          {
            field: 'id',
            message: `Vehicle handover with ID ${id} not found`,
          },
        ],
      });
    }

    await this.prisma.vehicleHandover.delete({ where: { id } });
  }
}
