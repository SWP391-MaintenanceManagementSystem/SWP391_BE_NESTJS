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
import { format } from 'date-fns';
import { CloudinaryService } from '../upload/cloudinary.service';

@Injectable()
export class VehicleHandoverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService
  ) {}

  async create(
    createDto: CreateVehicleHandoverDTO,
    staffAccountId: string,
    images?: Express.Multer.File[]
  ): Promise<VehicleHandoverDTO> {
    const { bookingId, odometer, note, description, date } = createDto;

    // --- Upload images to Cloudinary if provided ---
    let imageUrls: string[] = [];
    if (images && images.length > 0) {
      try {
        const uploadResults = await Promise.all(
          images.map(file => this.cloudinary.uploadImage(file))
        );
        imageUrls = uploadResults.map(result => result.secure_url);
      } catch (error) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: [
            {
              field: 'images',
              message: 'Failed to upload images to Cloudinary',
            },
          ],
        });
      }
    }

    // --- Validate and convert date ---
    const parsedDate = parseDate(date);
    const utcDate = vnToUtcDate(parsedDate!);

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

    // --- Validate handover date must be after booking date ---
    const parsedBookingDate = parseDate(booking.bookingDate)!;
    if (parsedDate! <= parsedBookingDate) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [
          {
            field: 'date',
            message: `Handover date must be after booking date (${format(parsedBookingDate, 'yyyy-MM-dd HH:mm')})`,
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
          imageUrls: imageUrls,
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

      return tx.vehicleHandover.findUnique({
        where: { id: newHandover.id },
        include: {
          staff: {
            include: { account: true },
          },
          booking: true,
        },
      });
    });
    return plainToInstance(VehicleHandoverDTO, handover, { excludeExtraneousValues: true });
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
    updateDto: UpdateVehicleHandoverDTO,
    images?: Express.Multer.File[]
  ): Promise<VehicleHandoverDTO> {
    // --- Validate handover exists ---
    const existing = await this.prisma.vehicleHandover.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!existing) {
      throw new NotFoundException({
        message: 'Validation failed',
        errors: [{ field: 'id', message: `Vehicle handover with ID ${id} not found` }],
      });
    }

    const { description, date, odometer, bookingId, note } = updateDto;

    let updatedImageUrls: string[] | undefined = undefined;
    if (images && images.length > 0) {
      try {
        const uploadResults = await Promise.all(
          images.map(file => this.cloudinary.uploadImage(file))
        );
        const newUrls = uploadResults.map(result => result.secure_url);

        // Merge with existing URLs
        updatedImageUrls = [...(existing.imageUrls || []), ...newUrls];
      } catch (error) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: [{ field: 'images', message: 'Failed to upload images to Cloudinary' }],
        });
      }
    }

    // --- Validate odometer ---
    if (odometer !== undefined) {
      if (isNaN(odometer) || odometer < 0) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: [{ field: 'odometer', message: 'Odometer must be a positive number' }],
        });
      }
    }

    let descriptionValue: string[] | null | undefined = undefined;
    if (description !== undefined) {
      if (!Array.isArray(description)) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: [{ field: 'description', message: 'Description must be an array of strings' }],
        });
      }

      if (description.length > 0 && description.some(d => typeof d !== 'string' || !d.trim())) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: [
            { field: 'description', message: 'Each description must be a non-empty string' },
          ],
        });
      }
      descriptionValue = description.length === 0 ? [] : description;
    }

    let noteValue: string | null | undefined = undefined;
    if (note !== undefined) {
      if (typeof note !== 'string') {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: [{ field: 'note', message: 'Note must be a string' }],
        });
      }

      noteValue = note.trim() === '' ? null : note.trim();
    }

    if (bookingId && bookingId !== existing.bookingId) {
      const newBooking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { handover: true },
      });

      if (!newBooking) {
        throw new NotFoundException({
          message: 'Validation failed',
          errors: [{ field: 'bookingId', message: `Booking with ID ${bookingId} not found` }],
        });
      }

      if (newBooking.handover && newBooking.handover.id !== id) {
        throw new ConflictException({
          message: 'Validation failed',
          errors: [{ field: 'bookingId', message: `Booking ${bookingId} already has a handover` }],
        });
      }
    }

    // --- Validate date ---
    let utcDate: Date | undefined = undefined;
    if (date !== undefined) {
      const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
      if (!datePattern.test(date)) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: [
            {
              field: 'date',
              message: "Invalid format. Expected 'YYYY-MM-DDTHH:mm'",
            },
          ],
        });
      }

      const parsedDate = parseDate(date);
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: [{ field: 'date', message: 'Invalid date value' }],
        });
      }

      // --- Validate handover date must be after booking date ---
      const currentBooking = bookingId
        ? await this.prisma.booking.findUnique({ where: { id: bookingId } })
        : existing.booking;

      if (currentBooking) {
        const parsedBookingDate = parseDate(currentBooking.bookingDate)!;
        if (parsedDate < parsedBookingDate) {
          throw new BadRequestException({
            message: 'Validation failed',
            errors: [
              {
                field: 'date',
                message: `Handover date must be after booking date (${format(parsedBookingDate, 'yyyy-MM-dd HH:mm')})`,
              },
            ],
          });
        }
      }

      utcDate = vnToUtcDate(parsedDate);
    }

    const updateData: Prisma.VehicleHandoverUpdateInput = {
      ...(noteValue !== undefined && { note: noteValue }),
      ...(odometer !== undefined && { odometer }),
      ...(utcDate && { date: utcDate }),
      ...(descriptionValue !== undefined && { description: descriptionValue }),
      ...(bookingId && { booking: { connect: { id: bookingId } } }),
      ...(updatedImageUrls !== undefined && { imageUrls: updatedImageUrls }),
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
