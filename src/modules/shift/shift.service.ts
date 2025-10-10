import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDTO } from './dto/create-shift.dto';
import { UpdateShiftDTO } from './dto/update-shift.dto';
import ShiftDTO from './dto/shift.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { plainToInstance } from 'class-transformer';
import { ShiftQueryDTO } from './dto/shift-query.dto';
import { AccountRole, ShiftStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShiftService {
  constructor(private readonly prismaService: PrismaService) {}

  async createShift(shift: CreateShiftDTO): Promise<ShiftDTO> {
    // Validate times
    const startTime = new Date(shift.startTime);
    const endTime = new Date(shift.endTime);
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Validate service center exists
    const existCenter = await this.prismaService.serviceCenter.findUnique({
      where: { id: shift.centerId },
    });
    if (!existCenter) {
      throw new NotFoundException(`Service center with ID ${shift.centerId} not found`);
    }

    // Check for duplicate shift name in same center
    const conflictShift = await this.prismaService.shift.findFirst({
      where: {
        centerId: shift.centerId,
        name: shift.name,
        status: ShiftStatus.ACTIVE,
      },
    });

    if (conflictShift) {
      throw new ConflictException(`Shift with name "${shift.name}" already exists in this center`);
    }

    const createdShift = await this.prismaService.shift.create({
      data: {
        name: shift.name,
        startTime: startTime,
        endTime: endTime,
        maximumSlot: shift.maximumSlot || 10,
        status: ShiftStatus.ACTIVE,
        centerId: shift.centerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        serviceCenter: {
          select: {
            name: true,
            address: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return plainToInstance(ShiftDTO, createdShift, {
      excludeExtraneousValues: true,
    });
  }

  async getShiftById(id: string): Promise<ShiftDTO> {
    const shift = await this.prismaService.shift.findUnique({
      where: { id },
      include: {
        serviceCenter: {
          select: {
            name: true,
            address: true,
            status: true,
          },
        },
        workSchedules: {
          include: {
            employee: {
              select: {
                accountId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    return plainToInstance(ShiftDTO, shift, {
      excludeExtraneousValues: true,
    });
  }

  async getShifts(filter: ShiftQueryDTO): Promise<PaginationResponse<ShiftDTO>> {
    let { page = 1, pageSize = 10, sortBy = 'createdAt' } = filter;

    page = Math.max(page, 1);
    pageSize = Math.max(pageSize, 1);

    const where: Prisma.ShiftWhereInput = {};

    // Apply filters
    if (filter.id) where.id = { contains: filter.id, mode: 'insensitive' };
    if (filter.centerId) where.centerId = { contains: filter.centerId, mode: 'insensitive' };
    if (filter.status !== undefined) where.status = filter.status;
    if (filter.name) where.name = { contains: filter.name, mode: 'insensitive' };
    if (filter.startTime) where.startTime = { gte: filter.startTime };
    if (filter.endTime) where.endTime = { lte: filter.endTime };

    // Build orderBy clause
    const orderByClause: Prisma.ShiftOrderByWithRelationInput = {};
    orderByClause[sortBy as keyof Prisma.ShiftOrderByWithRelationInput];

    const [shifts, total] = await this.prismaService.$transaction([
      this.prismaService.shift.findMany({
        where,
        select: {
          id: true,
          name: true,
          startTime: true,
          endTime: true,
          maximumSlot: true,
          status: true,
          centerId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: orderByClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.shift.count({ where }),
    ]);

    return {
      data: shifts.map(shift =>
        plainToInstance(ShiftDTO, shift, {
          excludeExtraneousValues: true,
        })
      ),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async updateShift(id: string, updateShiftDto: UpdateShiftDTO): Promise<ShiftDTO> {
    const existingShift = await this.prismaService.shift.findUnique({ where: { id } });

    if (!existingShift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    // Validate times
    if (updateShiftDto.startTime && updateShiftDto.endTime) {
      const startTime = new Date(updateShiftDto.startTime);
      const endTime = new Date(updateShiftDto.endTime);
      if (startTime >= endTime) throw new BadRequestException('Start time must be before end time');
    }

    // Check duplicate name
    if (updateShiftDto.name && updateShiftDto.name !== existingShift.name) {
      const conflictShift = await this.prismaService.shift.findFirst({
        where: {
          centerId: existingShift.centerId,
          name: updateShiftDto.name,
          status: ShiftStatus.ACTIVE,
          id: { not: id },
        },
      });
      if (conflictShift) {
        throw new ConflictException(
          `Shift with name "${updateShiftDto.name}" already exists in this center`
        );
      }
    }

    const updateData: any = {};

    const maybeDate = (val?: string | null) => (val ? new Date(val) : null);

    if (updateShiftDto.name !== undefined && updateShiftDto.name !== existingShift.name) {
      updateData.name = updateShiftDto.name;
    }

    if (
      updateShiftDto.startTime !== undefined &&
      new Date(updateShiftDto.startTime).getTime() !== existingShift.startTime.getTime()
    ) {
      updateData.startTime = new Date(updateShiftDto.startTime);
    }

    if (
      updateShiftDto.endTime !== undefined &&
      new Date(updateShiftDto.endTime).getTime() !== existingShift.endTime.getTime()
    ) {
      updateData.endTime = new Date(updateShiftDto.endTime);
    }

    if (
      updateShiftDto.maximumSlot !== undefined &&
      updateShiftDto.maximumSlot !== existingShift.maximumSlot
    ) {
      updateData.maximumSlot = updateShiftDto.maximumSlot;
    }

    if (updateShiftDto.status !== undefined && updateShiftDto.status !== existingShift.status) {
      updateData.status = updateShiftDto.status;
    }

    if (Object.keys(updateData).length === 0) {
      return plainToInstance(ShiftDTO, existingShift, { excludeExtraneousValues: true });
    }

    const updatedShift = await this.prismaService.shift.update({
      where: { id },
      data: updateData,
      include: {
        serviceCenter: {
          select: {
            name: true,
            address: true,
            status: true,
          },
        },
      },
    });

    return plainToInstance(ShiftDTO, updatedShift, { excludeExtraneousValues: true });
  }

  async deleteShift(id: string): Promise<void> {
    const existingShift = await this.prismaService.shift.findUnique({
      where: { id },
    });

    if (!existingShift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    if (existingShift.status === ShiftStatus.INACTIVE) {
      throw new BadRequestException('Shift is already inactive');
    }

    // Soft delete: set status to INACTIVE
    await this.prismaService.shift.update({
      where: { id },
      data: { status: ShiftStatus.INACTIVE },
    });
  }
}
