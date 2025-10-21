import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDTO } from './dto/create-shift.dto';
import { UpdateShiftDTO } from './dto/update-shift.dto';
import ShiftDTO from './dto/shift.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { plainToInstance } from 'class-transformer';
import { ShiftQueryDTO, ShiftWithCenterQueryDTO } from './dto/shift-query.dto';
import { ShiftStatus, Prisma } from '@prisma/client';
import { timeStringToDate, dateToTimeString } from 'src/common/time/time.util';
import { utcToVNDate, vnToUtcDate } from 'src/utils';

@Injectable()
export class ShiftService {
  constructor(private readonly prismaService: PrismaService) {}

  private validateTimes(startTimeStr: string, endTimeStr: string): string | null {
    // --- Convert to Date ---
    const start = vnToUtcDate(timeStringToDate(startTimeStr));
    const end = vnToUtcDate(timeStringToDate(endTimeStr));

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Invalid time value';
    }

    // --- Calculate duration ---
    const oneDayMs = 24 * 60 * 60 * 1000;
    let durationMs =
      end.getTime() >= start.getTime()
        ? end.getTime() - start.getTime()
        : end.getTime() + oneDayMs - start.getTime();

    const durationHours = durationMs / (1000 * 60 * 60);

    const startHour = start.getUTCHours();
    const endHour = end.getUTCHours();

    // --- Validate logic ---
    if (start.getTime() === end.getTime()) {
      return 'Start time and end time cannot be the same';
    }
    if (durationHours < 1) {
      return 'Shift duration must be at least 1 hour';
    }
    if (durationHours > 16) {
      return 'Shift duration cannot exceed 16 hours';
    }

    // --- Overnight case ---
    if (end.getTime() < start.getTime()) {
      const isEveningStart = startHour >= 17 && startHour <= 23;
      const isMorningEnd = endHour >= 0 && endHour <= 12;
      if (!isEveningStart || !isMorningEnd) {
        return 'Overnight shifts must start in the evening (≥17:00) and end in the morning (≤12:00)';
      }
    }

    return null;
  }

  async createShift(shift: CreateShiftDTO): Promise<ShiftDTO> {
    const startTime = vnToUtcDate(timeStringToDate(shift.startTime));
    const endTime = vnToUtcDate(timeStringToDate(shift.endTime));
    const errors: Record<string, string> = {};

    // --- Validate start/end time logic (overnight check) ---
    const timeError = this.validateTimes(shift.startTime, shift.endTime);
    if (timeError) errors['timeRange'] = timeError;

    // --- Check if service center exists ---
    const existCenter = await this.prismaService.serviceCenter.findUnique({
      where: { id: shift.centerId },
    });
    if (!existCenter) {
      errors['centerId'] = `Service center with ID ${shift.centerId} not found`;
    }

    // --- Check for duplicate shift name in the same center ---
    const conflictShift = await this.prismaService.shift.findFirst({
      where: {
        centerId: shift.centerId,
        name: shift.name,
        status: ShiftStatus.ACTIVE,
      },
    });
    if (conflictShift) {
      errors['name'] = `Shift "${shift.name}" already exists in this center`;
    }

    // --- If any errors, throw once ---
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    const createdShift = await this.prismaService.shift.create({
      data: {
        name: shift.name,
        startTime,
        endTime,
        maximumSlot: shift.maximumSlot ?? 10,
        status: ShiftStatus.ACTIVE,
        centerId: shift.centerId,
      },
      include: {
        serviceCenter: {
          select: { name: true, address: true, status: true },
        },
      },
    });

    return plainToInstance(
      ShiftDTO,
      {
        ...createdShift,
        startTime: dateToTimeString(createdShift.startTime),
        endTime: dateToTimeString(createdShift.endTime),
      },
      { excludeExtraneousValues: true }
    );
  }

  async getShiftById(id: string): Promise<ShiftDTO> {
    const shift = await this.prismaService.shift.findUnique({
      where: { id },
      include: {
        serviceCenter: true,
        workSchedules: {
          include: {
            employee: { select: { accountId: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    // convert Date (1970-01-01T08:00:00Z) → "08:00:00"
    return plainToInstance(
      ShiftDTO,
      {
        ...shift,
        startTime: dateToTimeString(shift.startTime),
        endTime: dateToTimeString(shift.endTime),
        serviceCenter: shift.serviceCenter
          ? {
              id: shift.serviceCenter.id,
              name: shift.serviceCenter.name,
              address: shift.serviceCenter.address,
              status: shift.serviceCenter.status,
              createdAt: shift.serviceCenter.createdAt,
              updatedAt: shift.serviceCenter.updatedAt,
            }
          : undefined,
      },
      { excludeExtraneousValues: true }
    );
  }

  async getShiftsWithCenters(
    filter: ShiftWithCenterQueryDTO
  ): Promise<PaginationResponse<ShiftDTO>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      orderBy = 'desc',
      startTime,
      endTime,
    } = filter;

    const where: Prisma.ShiftWhereInput = {
      ...(filter.id && { id: { contains: filter.id, mode: 'insensitive' } }),
      ...(filter.centerId && { centerId: { contains: filter.centerId, mode: 'insensitive' } }),
      ...(filter.centerName && {
        serviceCenter: { name: { contains: filter.centerName, mode: 'insensitive' } },
      }),
      ...(filter.status && { status: filter.status }),
      ...(filter.name && { name: { contains: filter.name, mode: 'insensitive' } }),
      ...(startTime && { startTime: { gte: timeStringToDate(startTime) } }),
      ...(endTime && { endTime: { lte: timeStringToDate(endTime) } }),
      ...(filter.maximumSlot !== undefined && { maximumSlot: filter.maximumSlot }),
    };

    const allowedSortFields = [
      'name',
      'startTime',
      'endTime',
      'maximumSlot',
      'createdAt',
      'updatedAt',
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [shifts, total] = await this.prismaService.$transaction([
      this.prismaService.shift.findMany({
        where,
        include: {
          serviceCenter: true,
        },
        orderBy: { [sortField]: orderBy },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.shift.count({ where }),
    ]);

    const formatted = shifts.map(s => ({
      ...s,
      startTime: dateToTimeString(utcToVNDate(s.startTime)),
      endTime: dateToTimeString(utcToVNDate(s.endTime)),
      serviceCenter: s.serviceCenter
        ? {
            id: s.serviceCenter.id,
            name: s.serviceCenter.name,
            address: s.serviceCenter.address,
            status: s.serviceCenter.status,
            createdAt: s.serviceCenter.createdAt,
            updatedAt: s.serviceCenter.updatedAt,
          }
        : undefined,
    }));

    return {
      data: plainToInstance(ShiftDTO, formatted, { excludeExtraneousValues: true }),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getShifts(filter: ShiftQueryDTO): Promise<{ data: ShiftDTO[] }> {
    const where: Prisma.ShiftWhereInput = {
      ...(filter.id && { id: { contains: filter.id, mode: 'insensitive' } }),
      ...(filter.centerId && { centerId: { contains: filter.centerId, mode: 'insensitive' } }),
      ...(filter.status && { status: filter.status }),
      ...(filter.name && { name: { contains: filter.name, mode: 'insensitive' } }),
      ...(filter.maximumSlot !== undefined && { maximumSlot: filter.maximumSlot }),
    };
    const shifts = await this.prismaService.shift.findMany({
      where,
      orderBy: filter.sortBy ? { [filter.sortBy]: filter.orderBy ?? 'asc' } : { createdAt: 'asc' },
    });
    const formatted = shifts.map(s => ({
      ...s,
      startTime: dateToTimeString(utcToVNDate(s.startTime)),
      endTime: dateToTimeString(utcToVNDate(s.endTime)),
    }));
    return { data: plainToInstance(ShiftDTO, formatted, { excludeExtraneousValues: true }) };
  }

  async updateShift(id: string, update: UpdateShiftDTO): Promise<ShiftDTO> {
    const existing = await this.prismaService.shift.findUnique({
      where: { id },
      include: { serviceCenter: true },
    });

    if (!existing) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    const errors: Record<string, string> = {};
    const data: Prisma.ShiftUpdateInput = {};

    // --- Validate name ---
    if (update.name !== undefined) {
      if (!update.name || update.name.trim() === '') {
        errors.name = 'Name can not be empty';
      } else if (update.name.length < 2 || update.name.length > 50) {
        errors.name = 'Name must be between 2 and 50 characters';
      } else if (update.name !== existing.name) {
        const conflict = await this.prismaService.shift.findFirst({
          where: {
            centerId: existing.centerId,
            name: update.name,
            id: { not: id },
            status: ShiftStatus.ACTIVE,
          },
        });
        if (conflict) {
          errors.name = `Shift "${update.name}" already exists in this center`;
        } else {
          data.name = update.name;
        }
      } else {
        data.name = update.name;
      }
    }

    // --- Validate times ---
    let finalStartTime = existing.startTime;
    let finalEndTime = existing.endTime;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

    if (update.startTime !== undefined) {
      if (!update.startTime || update.startTime.trim() === '') {
        errors.startTime = 'Start time can not be empty';
      } else {
        // Validate time format HH:MM:SS
        if (!timeRegex.test(update.startTime)) {
          errors.startTime = 'Start time must be in format HH:MM:SS';
        } else {
          try {
            finalStartTime = vnToUtcDate(timeStringToDate(update.startTime));
            data.startTime = finalStartTime;
          } catch (error) {
            errors.startTime = 'Invalid start time format';
          }
        }
      }
    }

    if (update.endTime !== undefined) {
      if (!update.endTime || update.endTime.trim() === '') {
        errors.endTime = 'End time can not be empty';
      } else {
        if (!timeRegex.test(update.endTime)) {
          errors.endTime = 'End time must be in format HH:MM:SS';
        } else {
          try {
            finalEndTime = vnToUtcDate(timeStringToDate(update.endTime));
            data.endTime = finalEndTime;
          } catch (error) {
            errors.endTime = 'Invalid end time format';
          }
        }
      }
    }

    // Validate time range if both times are valid
    if (!errors.startTime && !errors.endTime) {
      const timeError = this.validateTimes(
        dateToTimeString(finalStartTime),
        dateToTimeString(finalEndTime)
      );
      if (timeError) {
        errors.timeRange = timeError;
      }
    }

    // --- Validate maximumSlot ---
    if (update.maximumSlot !== undefined) {
      if (update.maximumSlot === null || update.maximumSlot === undefined) {
        errors.maximumSlot = 'Maximum slot can not be empty';
      } else if (typeof update.maximumSlot !== 'number') {
        errors.maximumSlot = 'Maximum slot must be a number';
      } else if (!Number.isInteger(update.maximumSlot)) {
        errors.maximumSlot = 'Maximum slot must be an integer';
      } else if (update.maximumSlot < 1) {
        errors.maximumSlot = 'Maximum slot must be at least 1';
      } else if (update.maximumSlot > 50) {
        errors.maximumSlot = 'Maximum slot cannot exceed 50';
      } else {
        data.maximumSlot = update.maximumSlot;
      }
    }

    // --- Validate status ---
    if (update.status !== undefined) {
      if (!update.status || (typeof update.status === 'string' && update.status.trim() === '')) {
        errors.status = 'Status can not be empty';
      } else {
        const validStatuses = Object.values(ShiftStatus);
        if (!validStatuses.includes(update.status as ShiftStatus)) {
          errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
        } else {
          data.status = update.status as ShiftStatus;
        }
      }
    }

    // --- Validate centerId ---
    if (update.centerId !== undefined) {
      if (!update.centerId || update.centerId.trim() === '') {
        errors.centerId = 'Service Center ID can not be empty';
      } else {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(update.centerId)) {
          errors.centerId = 'Service Center ID must be a valid UUID';
        } else if (update.centerId !== existing.centerId) {
          const center = await this.prismaService.serviceCenter.findUnique({
            where: { id: update.centerId },
          });
          if (!center) {
            errors.centerId = `Service center with ID ${update.centerId} not found`;
          } else {
            // Check if shift name exists in new center
            if (update.name || existing.name) {
              const shiftName = update.name || existing.name;
              const conflict = await this.prismaService.shift.findFirst({
                where: {
                  centerId: update.centerId,
                  name: shiftName,
                  id: { not: id },
                  status: ShiftStatus.ACTIVE,
                },
              });
              if (conflict) {
                errors.centerId = `Shift "${shiftName}" already exists in the target center`;
              } else {
                data.serviceCenter = { connect: { id: update.centerId } };
              }
            } else {
              data.serviceCenter = { connect: { id: update.centerId } };
            }
          }
        }
      }
    }

    // --- Throw all errors at once ---
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Only update if there are changes
    if (Object.keys(data).length === 0) {
      return plainToInstance(
        ShiftDTO,
        {
          ...existing,
          startTime: dateToTimeString(existing.startTime),
          endTime: dateToTimeString(existing.endTime),
          serviceCenter: existing.serviceCenter
            ? {
                id: existing.serviceCenter.id,
                name: existing.serviceCenter.name,
                address: existing.serviceCenter.address,
                status: existing.serviceCenter.status,
                createdAt: existing.serviceCenter.createdAt,
                updatedAt: existing.serviceCenter.updatedAt,
              }
            : undefined,
        },
        { excludeExtraneousValues: true }
      );
    }

    const updated = await this.prismaService.shift.update({
      where: { id },
      data,
      include: {
        serviceCenter: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return plainToInstance(
      ShiftDTO,
      {
        ...updated,
        startTime: dateToTimeString(utcToVNDate(updated.startTime)),
        endTime: dateToTimeString(utcToVNDate(updated.endTime)),
        serviceCenter: updated.serviceCenter
          ? {
              id: updated.serviceCenter.id,
              name: updated.serviceCenter.name,
              address: updated.serviceCenter.address,
              status: updated.serviceCenter.status,
              createdAt: updated.serviceCenter.createdAt,
              updatedAt: updated.serviceCenter.updatedAt,
            }
          : undefined,
      },
      { excludeExtraneousValues: true }
    );
  }

  async deleteShift(id: string): Promise<void> {
    const shift = await this.prismaService.shift.findUnique({ where: { id } });
    if (!shift) throw new NotFoundException(`Shift with ID ${id} not found`);
    if (shift.status === ShiftStatus.INACTIVE)
      throw new BadRequestException('Shift already inactive');

    await this.prismaService.shift.update({
      where: { id },
      data: { status: ShiftStatus.INACTIVE },
    });
  }
}
