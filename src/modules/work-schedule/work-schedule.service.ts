import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';
import { WorkScheduleQueryDto } from './dto/work-schedule-query.dto';
import { WorkScheduleDto } from './dto/work-schedule.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { plainToInstance } from 'class-transformer';
import { AccountRole, Prisma } from '@prisma/client';

@Injectable()
export class WorkScheduleService {
  constructor(private prismaService: PrismaService) {}

  async generateWorkSchedulesFromShiftPattern(
    shiftId: string,
    employeeId: string[],
    userRole: AccountRole
  ): Promise<WorkScheduleDto[]> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can generate work schedules');
    }

    const shift = await this.prismaService.shift.findUnique({
      where: { id: shiftId },
      include: { serviceCenter: true },
    });

    if (!shift || !shift.startDate || !shift.endDate || !shift.repeatDays?.length) {
      throw new BadRequestException(
        'Shift must have startDate, endDate, and repeatDays to generate schedules'
      );
    }

    if (shift.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot generate schedules for an inactive shift');
    }

    if (shift.serviceCenter.status !== 'OPEN') {
      throw new BadRequestException(
        'Cannot generate schedules for a shift in a closed service center'
      );
    }

    const employees = await this.prismaService.employee.findMany({
      where: {
        accountId: { in: employeeId },
        account: {
          role: { in: [AccountRole.STAFF, AccountRole.TECHNICIAN] },
        },
      },
    });

    if (employees.length !== employeeId.length) {
      throw new BadRequestException('Some employee IDs are invalid or not STAFF/TECHNICIAN');
    }

    const scheduleData = [];
    const currentDate = new Date(shift.startDate);
    const endDate = new Date(shift.endDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

      if (shift.repeatDays.includes(dayOfWeek)) {
        // Check shift capacity for this date
        const existingCount = await this.prismaService.workSchedule.count({
          where: {
            shiftId,
            date: new Date(currentDate),
          },
        });

        if (shift.maximumSlot && existingCount + employeeId.length > shift.maximumSlot) {
          throw new ConflictException(
            `Shift capacity exceeded on ${currentDate.toDateString()}. ` +
              `Max: ${shift.maximumSlot}, Current: ${existingCount}, Trying to add: ${employeeId.length}`
          );
        }

        // Add schedule data for each employee on this date
        for (const employeeIds of employeeId) {
          scheduleData.push({
            employeeId: employeeIds,
            shiftId,
            date: new Date(currentDate),
          });
        }
      }
      // Fix: Move to next day properly
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (scheduleData.length === 0) {
      throw new BadRequestException('No valid dates found based on shift repeat pattern');
    }

    // Check for duplicate assignments
    const existingSchedules = await this.prismaService.workSchedule.findMany({
      where: {
        OR: scheduleData.map(data => ({
          employeeId: data.employeeId,
          shiftId: data.shiftId,
          date: data.date,
        })),
      },
    });

    if (existingSchedules.length > 0) {
      const duplicates = existingSchedules.map(
        s => `Employee ${s.employeeId} on ${s.date.toDateString()}`
      );
      throw new ConflictException(`Duplicate assignments found: ${duplicates.join(', ')}`);
    }

    await this.prismaService.workSchedule.createMany({
      data: scheduleData,
    });

    const createdSchedules = await this.prismaService.workSchedule.findMany({
      where: {
        shiftId,
        employeeId: { in: employeeId },
        date: {
          gte: shift.startDate,
          lte: shift.endDate,
        },
      },
      include: {
        employee: { include: { account: true } },
        shift: { include: { serviceCenter: true } },
      },
      orderBy: [{ date: 'asc' }, { employee: { firstName: 'asc' } }],
    });

    return createdSchedules.map(ws => plainToInstance(WorkScheduleDto, ws));
  }

  async createWorkSchedule(
    createWorkScheduleDto: CreateWorkScheduleDto,
    userRole: AccountRole,
    currentUserId?: string
  ): Promise<WorkScheduleDto[]> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can create work schedule assignments');
    }

    const shift = await this.prismaService.shift.findUnique({
      where: { id: createWorkScheduleDto.shiftId },
      include: { serviceCenter: true },
    });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${createWorkScheduleDto.shiftId} not found`);
    }

    if (createWorkScheduleDto.generateFromPattern && shift.repeatDays?.length) {
      return this.generateWorkSchedulesFromShiftPattern(
        createWorkScheduleDto.shiftId,
        createWorkScheduleDto.employeeId,
        userRole
      );
    }

    const targetDate = new Date(createWorkScheduleDto.date);

    const employees = await this.prismaService.employee.findMany({
      where: {
        accountId: { in: createWorkScheduleDto.employeeId },
        account: {
          role: { in: [AccountRole.STAFF, AccountRole.TECHNICIAN] },
        },
      },
      include: { account: true },
    });

    if (employees.length !== createWorkScheduleDto.employeeId.length) {
      throw new BadRequestException('Some employee IDs are invalid or not STAFF/TECHNICIAN');
    }

    // Check capacity for specific date
    const existingCount = await this.prismaService.workSchedule.count({
      where: {
        shiftId: createWorkScheduleDto.shiftId,
        date: targetDate,
      },
    });

    if (
      shift.maximumSlot &&
      existingCount + createWorkScheduleDto.employeeId.length > shift.maximumSlot
    ) {
      throw new ConflictException(
        `Shift capacity exceeded on ${targetDate.toDateString()}. ` +
          `Max: ${shift.maximumSlot}, Current: ${existingCount}, Available: ${shift.maximumSlot - existingCount}`
      );
    }

    // Check duplicate assignments
    const existingSchedules = await this.prismaService.workSchedule.findMany({
      where: {
        shiftId: createWorkScheduleDto.shiftId,
        date: targetDate,
        employeeId: { in: createWorkScheduleDto.employeeId },
      },
    });

    if (existingSchedules.length > 0) {
      const duplicateEmployees = existingSchedules.map(s => s.employeeId);
      throw new ConflictException(
        `These employees are already assigned to this shift on ${targetDate.toDateString()}: ${duplicateEmployees.join(', ')}`
      );
    }

    // Create single date schedules
    const workSchedules = await this.prismaService.$transaction(
      createWorkScheduleDto.employeeId.map(employeeId =>
        this.prismaService.workSchedule.create({
          data: {
            employeeId,
            shiftId: createWorkScheduleDto.shiftId,
            date: targetDate,
          },
          include: {
            employee: { include: { account: true } },
            shift: { include: { serviceCenter: true } },
          },
        })
      )
    );

    return workSchedules.map(ws => plainToInstance(WorkScheduleDto, ws));
  }

  async getWorkSchedules(
    filter: WorkScheduleQueryDto,
    userRole: AccountRole,
    employeeId?: string
  ): Promise<PaginationResponse<WorkScheduleDto>> {
    let { page = 1, pageSize = 10, sortBy = 'date', orderBy = 'desc' } = filter;
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 10;

    const where: Prisma.WorkScheduleWhereInput = {};

    if (filter.shiftId) where.shiftId = filter.shiftId;
    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.centerId) {
      where.shift = { centerId: filter.centerId };
    }

    // Date range filters
    if (filter.dateFrom && filter.dateTo) {
      where.date = {
        gte: new Date(filter.dateFrom),
        lte: new Date(filter.dateTo),
      };
    } else if (filter.dateFrom) {
      where.date = { gte: new Date(filter.dateFrom) };
    } else if (filter.dateTo) {
      where.date = { lte: new Date(filter.dateTo) };
    }

    if ((userRole === AccountRole.STAFF || userRole === AccountRole.TECHNICIAN) && employeeId) {
      const assignedCenters = await this.prismaService.workCenter.findMany({
        where: { employeeId },
        select: { centerId: true },
      });
      const centerIds = assignedCenters.map(ac => ac.centerId);

      where.OR = [
        { employeeId }, // Own schedules
        ...(centerIds.length > 0 ? [{ shift: { centerId: { in: centerIds } } }] : []),
      ];
    }

    const orderByClause: Prisma.WorkScheduleOrderByWithRelationInput = {};
    if (sortBy === 'employee') {
      orderByClause.employee = { firstName: orderBy };
    } else if (sortBy === 'shift') {
      orderByClause.shift = { name: orderBy };
    } else {
      orderByClause[sortBy as keyof Prisma.WorkScheduleOrderByWithRelationInput] = orderBy;
    }

    const [workSchedules, total] = await this.prismaService.$transaction([
      this.prismaService.workSchedule.findMany({
        where,
        include: {
          employee: { include: { account: true } },
          shift: { include: { serviceCenter: true } },
        },
        orderBy: orderByClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.workSchedule.count({ where }),
    ]);

    return {
      data: workSchedules.map(ws => plainToInstance(WorkScheduleDto, ws)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getWorkScheduleById(
    id: string,
    userRole: AccountRole,
    employeeId?: string
  ): Promise<WorkScheduleDto> {
    const workSchedule = await this.prismaService.workSchedule.findUnique({
      where: { id },
      include: {
        employee: { include: { account: true } },
        shift: { include: { serviceCenter: true } },
      },
    });

    if (!workSchedule) {
      throw new NotFoundException(`Work schedule with ID ${id} not found`);
    }

    if ((userRole === AccountRole.STAFF || userRole === AccountRole.TECHNICIAN) && employeeId) {
      const isOwnSchedule = workSchedule.employeeId === employeeId;

      if (!isOwnSchedule) {
        // Check if user is assigned to the same center
        const isAssignedCenter = await this.prismaService.workCenter.findFirst({
          where: {
            employeeId,
            centerId: workSchedule.shift.centerId,
          },
        });
        if (!isAssignedCenter) {
          throw new ForbiddenException('Access denied');
        }
      }
    }

    return plainToInstance(WorkScheduleDto, workSchedule);
  }

  async updateWorkSchedule(
    shiftId: string,
    date: string,
    updateDto: UpdateWorkScheduleDto,
    userRole: AccountRole
  ): Promise<WorkScheduleDto[]> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update work schedule assignments');
    }

    const shift = await this.prismaService.shift.findUnique({
      where: { id: shiftId },
      include: { serviceCenter: true },
    });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${shiftId} not found`);
    }

    const targetDate = new Date(date);

    const existing = await this.prismaService.workSchedule.findMany({
      where: { shiftId, date: targetDate },
    });
    const existingIds = existing.map(e => e.employeeId);
    const newIds = updateDto.employeeId || [];

    const isSame =
      existingIds.length === newIds.length && existingIds.every(id => newIds.includes(id));
    if (isSame) {
      return existing.map(ws => plainToInstance(WorkScheduleDto, ws));
    }
    if (shift.maximumSlot && newIds.length > shift.maximumSlot) {
      throw new ConflictException(
        `Shift capacity exceeded (max: ${shift.maximumSlot}, trying: ${newIds.length})`
      );
    }

    // Calculate changes
    const toAdd = newIds.filter(id => !existingIds.includes(id));
    const toRemove = existingIds.filter(id => !newIds.includes(id));

    if (toAdd.length > 0) {
      const validEmployees = await this.prismaService.employee.findMany({
        where: {
          accountId: { in: toAdd },
          account: { role: { in: [AccountRole.STAFF, AccountRole.TECHNICIAN] } },
        },
      });

      if (validEmployees.length !== toAdd.length) {
        throw new BadRequestException('Some employee IDs are invalid or not STAFF/TECHNICIAN');
      }
    }

    // Apply changes
    if (toAdd.length || toRemove.length) {
      await this.prismaService.$transaction([
        // Remove employees
        ...(toRemove.length > 0
          ? [
              this.prismaService.workSchedule.deleteMany({
                where: { shiftId, date: targetDate, employeeId: { in: toRemove } },
              }),
            ]
          : []),
        // Add new employees
        ...toAdd.map(empId =>
          this.prismaService.workSchedule.create({
            data: { employeeId: empId, shiftId, date: targetDate },
          })
        ),
      ]);
    }

    const updated = await this.prismaService.workSchedule.findMany({
      where: { shiftId, date: targetDate },
      include: {
        employee: { include: { account: true } },
        shift: { include: { serviceCenter: true } },
      },
      orderBy: { employee: { firstName: 'asc' } },
    });

    return updated.map(ws => plainToInstance(WorkScheduleDto, ws));
  }

  async deleteWorkSchedule(
    id: string,
    userRole: AccountRole,
    employeeId?: string
  ): Promise<{ message: string }> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can delete work schedule assignments');
    }

    const workSchedule = await this.prismaService.workSchedule.findUnique({
      where: { id },
      include: {
        shift: { include: { serviceCenter: true } },
        employee: { include: { account: true } },
      },
    });

    if (!workSchedule) {
      throw new NotFoundException(`Work schedule with ID ${id} not found`);
    }

    await this.prismaService.workSchedule.delete({
      where: { id },
    });

    const employeeRole = workSchedule.employee.account?.role;
    return {
      message: `Removed ${employeeRole} ${workSchedule.employee.firstName} ${workSchedule.employee.lastName} from shift "${workSchedule.shift.name}" on ${workSchedule.date.toDateString()}`,
    };
  }
}
