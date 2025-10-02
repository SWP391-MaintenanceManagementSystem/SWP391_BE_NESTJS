import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import ShiftDTO from './dto/shift.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { plainToInstance } from 'class-transformer';
import { ShiftQueryDTO } from './dto/shift-query.dto';
import { AccountRole, ShiftStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShiftService {
  constructor(private readonly prismaService: PrismaService) {}
  async createShift(shift: CreateShiftDto): Promise<ShiftDTO> {
    const startTime = new Date(shift.startTime);
    const endTime = new Date(shift.endTime);
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }
    if (shift.startDate && shift.endDate) {
      const startDate = new Date(shift.startDate);
      const endDate = new Date(shift.endDate);
      if (startDate > endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }
    const existCenter = await this.prismaService.serviceCenter.findUnique({
      where: { id: shift.centerId }
    });
    if (!existCenter) {
      throw new NotFoundException(`Service center with ID ${shift.centerId} not found`);
    }

    const conflictShift = await this.prismaService.shift.findFirst({
      where: {
        centerId: shift.centerId,
        name: shift.name,
        status: ShiftStatus.ACTIVE,
      }
    });

    if (conflictShift) {
      throw new ConflictException(`Shift with name ${shift.name} already exists in this center`);
    }
    const createdShift = await this.prismaService.shift.create({
      data: {
        name: shift.name,
        startTime: new Date(shift.startTime),
        endTime: new Date(shift.endTime),
        startDate: shift.startDate ? new Date(shift.startDate) : undefined,
        endDate: shift.endDate ? new Date(shift.endDate) : undefined,
        maximumSlot: shift.maximumSlot,
        status: ShiftStatus.ACTIVE,
        repeatDays: shift.repeatDays,
        centerId: shift.centerId,
      },
      include: {
        serviceCenter: true,
        _count: {
          select: { workSchedules: true }
        }
      }
    });
    return plainToInstance(ShiftDTO, createdShift);
  }

  async getShiftById(id: string, userRole: AccountRole, employeeId?: string): Promise<ShiftDTO> {
    const shift = await this.prismaService.shift.findUnique({
      where: { id },
      include: {
        serviceCenter: true,
        workSchedules: {
          include: {
            employee: true,
            shift: true
          }
        },
        _count: {
          select: { workSchedules: true }
        }
      }
    });
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
    if (userRole === AccountRole.STAFF && employeeId) {
      const isAssigned = await this.prismaService.workCenter.findFirst({
        where: {
          employeeId,
          centerId: shift.centerId,
        }
      });
      if (!isAssigned) {
        throw new ForbiddenException('You are not assigned to this service center');
      }
    } else if (userRole === AccountRole.TECHNICIAN && employeeId) {
      const isAssigned = shift.workSchedules.some(ws => ws.employeeId === employeeId);
      if (!isAssigned) {
        throw new ForbiddenException('You can only access your assigned shifts');
      }
    }
    return plainToInstance(ShiftDTO, shift);
  }

  async getShifts(
    filter: ShiftQueryDTO,
    userRole: AccountRole,
    employeeId?: string
  ): Promise<PaginationResponse<ShiftDTO>> {
    let { page = 1, pageSize = 10, sortBy = 'createdAt', orderBy = 'desc' } = filter;
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 10;

    const where: Prisma.ShiftWhereInput = {};

    if (filter.centerId) where.centerId = filter.centerId;
    if (filter.status !== undefined) where.status = filter.status;
    if (filter.name) where.name = { contains: filter.name, mode: 'insensitive' };
    if (filter.startDate) where.startDate = { gte: filter.startDate };
    if (filter.endDate) where.endDate = { lte: filter.endDate };
    if (filter.startTime) where.startTime = { gte: filter.startTime };
    if (filter.endTime) where.endTime = { lte: filter.endTime };

    // Handle repeatDays filter
    if (filter.repeatDays && filter.repeatDays.length > 0) {
      const dayConditions = filter.repeatDays.map(day => ({
        repeatDays: { contains: day }
      }));
      where.OR = dayConditions;
    }

    if (userRole === AccountRole.STAFF && employeeId) {
      // STAFF: Only see shifts from assigned centers
      const assignedCenters = await this.prismaService.workCenter.findMany({
        where: { employeeId },
        select: { centerId: true }
      });
      const centerIds = assignedCenters.map(wc => wc.centerId);

      if (centerIds.length === 0) {
        return {
          data: [],
          page,
          pageSize,
          total: 0,
          totalPages: 0,
        };
      }

      where.centerId = { in: centerIds };
    } else if (userRole === AccountRole.TECHNICIAN && employeeId) {
      // TECHNICIAN: Only see assigned shifts
      where.workSchedules = {
        some: { employeeId }
      };
    }

    const orderByClause: Prisma.ShiftOrderByWithRelationInput = {};
    if (sortBy === 'centerId') {
      orderByClause.serviceCenter = { name: orderBy };
    } else {
      orderByClause[sortBy as keyof Prisma.ShiftOrderByWithRelationInput] = orderBy;
    }

    const [shifts, total] = await this.prismaService.$transaction([
      this.prismaService.shift.findMany({
        where,
        include: {
          serviceCenter: true,
          _count: {
            select: { workSchedules: true }
          },
        },
        orderBy: orderByClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.shift.count({ where })
    ]);

    return {
      data: plainToInstance(ShiftDTO, shifts),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async updateShift(id: string, updateShiftDto: UpdateShiftDto): Promise<ShiftDTO> {
    const existingShift = await this.prismaService.shift.findUnique({
      where: { id },
    });
    if (!existingShift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
    if (updateShiftDto.startTime && updateShiftDto.endTime) {
      const startTime = new Date(updateShiftDto.startTime);
      const endTime = new Date(updateShiftDto.endTime);
      if (startTime >= endTime) {
        throw new BadRequestException('Start time must be before end time');
      }
    }

    if (updateShiftDto.startDate && updateShiftDto.endDate) {
      const startDate = new Date(updateShiftDto.startDate);
      const endDate = new Date(updateShiftDto.endDate);
      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }
    if (updateShiftDto.name && updateShiftDto.name !== existingShift.name) {
      const conflictShift = await this.prismaService.shift.findFirst({
        where: {
          centerId: existingShift.centerId,
          name: updateShiftDto.name,
          status: ShiftStatus.ACTIVE,
          id: { not: id },
        }
      });
      if (conflictShift) {
        throw new ConflictException(`Shift with name ${updateShiftDto.name} already exists in this center`);
      }
    }
    const updatedData: any = {};
    if (updateShiftDto.name !== undefined) updatedData.name = updateShiftDto.name;
    if (updateShiftDto.startTime !== undefined) updatedData.startTime = new Date(updateShiftDto.startTime);
    if (updateShiftDto.endTime !== undefined) updatedData.endTime = new Date(updateShiftDto.endTime);
    if (updateShiftDto.startDate !== undefined) updatedData.startDate = updateShiftDto.startDate ? new Date(updateShiftDto.startDate) : null;
    if (updateShiftDto.endDate !== undefined) updatedData.endDate = updateShiftDto.endDate ? new Date(updateShiftDto.endDate) : null;
    if (updateShiftDto.maximumSlot !== undefined) updatedData.maximumSlot = updateShiftDto.maximumSlot;
    if (updateShiftDto.repeatDays !== undefined) updatedData.repeatDays = updateShiftDto.repeatDays;
    const updatedShift = await this.prismaService.shift.update({
      where: { id },
      data: updatedData,
      include: {
        serviceCenter: true,
        _count: {
          select: { workSchedules: true }
        }
      }
    });
    return plainToInstance(ShiftDTO, updatedShift);
  }

  async deleteShift(id: string): Promise<void> {
    const existingShift = await this.prismaService.shift.findUnique({
      where: { id },
      include: {
        _count: { select: { workSchedules: true } }
      }
    });
    if (!existingShift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
    if (existingShift._count.workSchedules > 0) {
      throw new BadRequestException('Cannot delete shift with assigned work schedules');
    }
    if (existingShift._count.workSchedules === 0) {
      await this.prismaService.shift.update({
        where: { id },
        data: { status: ShiftStatus.INACTIVE },
        include: {
          _count: { select: { workSchedules: true } }
        }
      });
    }
    // If you prefer to hard delete when there are no work schedules
    //  else {
    //   await this.prismaService.shift.delete({
    //     where: { id }
    //   });
    // }
  }
}
