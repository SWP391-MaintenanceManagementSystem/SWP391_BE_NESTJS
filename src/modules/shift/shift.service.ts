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
import { ShiftQueryDTO } from './dto/shift-query.dto';
import { ShiftStatus, Prisma } from '@prisma/client';
import { timeStringToDate, dateToTimeString } from 'src/common/time/time.util';

@Injectable()
export class ShiftService {
  constructor(private readonly prismaService: PrismaService) {}

  async createShift(shift: CreateShiftDTO): Promise<ShiftDTO> {
    const startTime = timeStringToDate(shift.startTime);
    const endTime = timeStringToDate(shift.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    const existCenter = await this.prismaService.serviceCenter.findUnique({
      where: { id: shift.centerId },
    });
    if (!existCenter) {
      throw new NotFoundException(`Service center with ID ${shift.centerId} not found`);
    }

    const conflictShift = await this.prismaService.shift.findFirst({
      where: {
        centerId: shift.centerId,
        name: shift.name,
        status: ShiftStatus.ACTIVE,
      },
    });
    if (conflictShift) {
      throw new ConflictException(`Shift "${shift.name}" already exists in this center`);
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
        serviceCenter: { select: { name: true, address: true, status: true } },
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
      },
      { excludeExtraneousValues: true }
    );
  }

  async getShifts(filter: ShiftQueryDTO): Promise<PaginationResponse<ShiftDTO>> {
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
      ...(filter.status && { status: filter.status }),
      ...(filter.name && { name: { contains: filter.name, mode: 'insensitive' } }),
      ...(startTime && { startTime: { gte: timeStringToDate(startTime) } }),
      ...(endTime && { endTime: { lte: timeStringToDate(endTime) } }),
    };

    const allowedSortFields = ['name', 'startTime', 'endTime', 'createdAt', 'updatedAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [shifts, total] = await this.prismaService.$transaction([
      this.prismaService.shift.findMany({
        where,
        orderBy: { [sortField]: orderBy },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.shift.count({ where }),
    ]);

    const formatted = shifts.map(s => ({
      ...s,
      startTime: dateToTimeString(s.startTime),
      endTime: dateToTimeString(s.endTime),
    }));

    return {
      data: plainToInstance(ShiftDTO, formatted, { excludeExtraneousValues: true }),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async updateShift(id: string, update: UpdateShiftDTO): Promise<ShiftDTO> {
    const existing = await this.prismaService.shift.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Shift with ID ${id} not found`);

    const data: Prisma.ShiftUpdateInput = {};

    if (update.name && update.name !== existing.name) {
      const conflict = await this.prismaService.shift.findFirst({
        where: { centerId: existing.centerId, name: update.name, id: { not: id } },
      });
      if (conflict) throw new ConflictException(`Shift "${update.name}" already exists.`);
      data.name = update.name;
    }

    if (update.startTime) data.startTime = timeStringToDate(update.startTime);
    if (update.endTime) data.endTime = timeStringToDate(update.endTime);
    if (update.maximumSlot !== undefined) data.maximumSlot = update.maximumSlot;
    if (update.status) data.status = update.status;

    if (data.startTime && data.endTime && data.startTime >= data.endTime)
      throw new BadRequestException('Start time must be before end time');

    const updated = await this.prismaService.shift.update({
      where: { id },
      data,
      include: { serviceCenter: { select: { name: true, address: true, status: true } } },
    });

    return plainToInstance(
      ShiftDTO,
      {
        ...updated,
        startTime: dateToTimeString(updated.startTime),
        endTime: dateToTimeString(updated.endTime),
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
