import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCyclicWorkScheduleDTO } from './dto/create-cyclic-work-schedule.dto';
import { UpdateCyclicWorkScheduleDTO } from './dto/update-cyclic-work-schedule.dto';
import { WorkScheduleQueryDTO } from './dto/work-schedule-query.dto';
import { WorkScheduleDTO } from './dto/work-schedule.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { plainToInstance } from 'class-transformer';
import { AccountRole, Prisma } from '@prisma/client';
import { dateToTimeString } from 'src/common/time/time.util';

@Injectable()
export class WorkScheduleService {
  constructor(private prismaService: PrismaService) {}

  private formatShiftTime(ws: any) {
    return {
      ...ws,
      shift: ws.shift
        ? {
            ...ws.shift,
            startTime: dateToTimeString(ws.shift.startTime),
            endTime: dateToTimeString(ws.shift.endTime),
          }
        : null,
    };
  }
  private normalizeDate(dateStr: string): Date {
    const d = new Date(dateStr);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  async createCyclicWorkSchedule(
    createCyclicDto: CreateCyclicWorkScheduleDTO,
    userRole: AccountRole
  ): Promise<WorkScheduleDTO[]> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can create cyclic work schedule assignments');
    }

    const { employeeId, shiftId, startDate, endDate, repeatDays } = createCyclicDto;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const errors: Record<string, string> = {};

    // --- Validate employeeId ---
    let employee = null;
    if (!employeeId || employeeId.trim() === '') {
      errors.employeeId = 'Employee ID is required and cannot be empty';
    } else {
      if (!uuidRegex.test(employeeId)) {
        errors.employeeId = 'Employee ID must be a valid UUID';
      } else {
        employee = await this.prismaService.employee.findUnique({
          where: { accountId: employeeId },
          include: { account: true },
        });
        if (!employee || !employee.account) {
          errors.employeeId = `Employee with ID ${employeeId} not found`;
        } else if (
          employee.account.role !== AccountRole.TECHNICIAN &&
          employee.account.role !== AccountRole.STAFF
        ) {
          errors.employeeId = `Only STAFF and TECHNICIAN employees can be assigned. This employee has role ${employee.account.role}`;
        }
      }
    }

    // --- Validate shiftId ---
    let shift = null;
    if (!shiftId || shiftId.trim() === '') {
      errors.shiftId = 'Shift ID is required and cannot be empty';
    } else {
      if (!uuidRegex.test(shiftId)) {
        errors.shiftId = 'Shift ID must be a valid UUID';
      } else {
        shift = await this.prismaService.shift.findUnique({
          where: { id: shiftId },
          include: { serviceCenter: true },
        });
        if (!shift) {
          errors.shiftId = `Shift with ID ${shiftId} not found`;
        }
      }
    }

    // --- Validate dates ---
    let start: Date | null = null;
    let end: Date | null = null;

    if (!startDate || startDate.trim() === '') {
      errors.startDate = 'Start date is required and cannot be empty';
    } else {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        errors.startDate = 'Start date must be a valid ISO date string';
      } else {
        start.setUTCHours(0, 0, 0, 0);
      }
    }

    if (!endDate || endDate.trim() === '') {
      errors.endDate = 'End date is required and cannot be empty';
    } else {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        errors.endDate = 'End date must be a valid ISO date string';
      } else {
        end.setUTCHours(0, 0, 0, 0);
      }
    }

    // Validate date range
    if (start && end && start > end) {
      errors.dateRange = 'Start date must be before or equal to end date';
    }

    // --- Validate repeatDays ---
    if (!repeatDays || !Array.isArray(repeatDays)) {
      errors.repeatDays = 'Repeat days is required and must be an array';
    } else if (repeatDays.length === 0) {
      errors.repeatDays = 'At least one repeat day is required';
    } else if (repeatDays.length > 7) {
      errors.repeatDays = 'Maximum 7 repeat days allowed';
    } else {
      const invalidDays = repeatDays.filter(day => !Number.isInteger(day) || day < 0 || day > 6);
      if (invalidDays.length > 0) {
        errors.repeatDays = 'Each repeat day must be an integer between 0 and 6';
      }
    }

    // --- Throw all validation errors at once ---
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors,
      });
    }

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const scheduleDates: Date[] = [];

    for (let t = start!.getTime(); t <= end!.getTime(); t += ONE_DAY) {
      const d = new Date(t);
      if (repeatDays.includes(d.getUTCDay())) {
        scheduleDates.push(d);
      }
    }

    if (scheduleDates.length === 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { repeatDays: 'No valid repeat days within the specified date range' },
      });
    }

    const existingSchedules = await this.prismaService.workSchedule.findMany({
      where: {
        employeeId,
        shiftId,
        date: { in: scheduleDates },
      },
      select: { date: true },
    });

    const existingDates = new Set(existingSchedules.map(e => e.date.toISOString().slice(0, 10)));

    const counts = await this.prismaService.workSchedule.groupBy({
      by: ['date'],
      where: { shiftId },
      _count: { date: true },
    });

    const countMap = new Map<string, number>();
    counts.forEach(c => countMap.set(c.date.toISOString().slice(0, 10), c._count.date));

    const toCreate = scheduleDates.filter(d => {
      const key = d.toISOString().slice(0, 10);
      if (existingDates.has(key)) return false;
      const currentCount = countMap.get(key) || 0;
      return !shift!.maximumSlot || currentCount < shift!.maximumSlot;
    });

    if (toCreate.length === 0) {
      throw new ConflictException(
        'No new schedules can be created (all slots full or schedules already exist)'
      );
    }

    const activeAssignment = await this.prismaService.workCenter.findFirst({
      where: {
        employeeId,
        centerId: shift!.centerId,
        startDate: { lte: end! },
        OR: [{ endDate: null }, { endDate: { gte: start! } }],
      },
      include: { serviceCenter: true },
    });

    if (!activeAssignment) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          workCenter:
            'Employee does not have an active work center assignment for the specified shift',
        },
      });
    }

    await this.prismaService.workSchedule.createMany({
      data: toCreate.map(date => ({
        employeeId,
        shiftId,
        date,
      })),
    });

    const created = await this.prismaService.workSchedule.findMany({
      where: {
        employeeId,
        shiftId,
        date: { in: toCreate },
      },
      include: {
        employee: {
          include: {
            account: {
              select: {
                email: true,
                role: true,
                phone: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                employee: {
                  select: {
                    firstName: true,
                    lastName: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        },
        shift: {
          select: {
            name: true,
            startTime: true,
            endTime: true,
            maximumSlot: true,
            status: true,
            createdAt: true,
            updatedAt: true,
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
        },
      },
    });

    return created.map(ws =>
      plainToInstance(WorkScheduleDTO, this.formatShiftTime(ws), {
        excludeExtraneousValues: true,
      })
    );
  }

  async getWorkSchedules(
    filter: WorkScheduleQueryDTO,
    userRole: AccountRole,
    employeeId?: string
  ): Promise<PaginationResponse<WorkScheduleDTO>> {
    let { page = 1, pageSize = 10, sortBy = 'date', orderBy = 'desc' } = filter;
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 10;

    const where: Prisma.WorkScheduleWhereInput = {};
    if (filter.id) where.id = filter.id;
    if (filter.shiftId) where.shiftId = filter.shiftId;
    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.centerId) {
      where.shift = { centerId: filter.centerId };
    }

    // Date filters
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

    if (filter.role) {
      const whereRole: Prisma.AccountWhereInput = { role: filter.role };
      where.employee = where.employee || {};
      where.employee.account = whereRole;
    }

    // --- Filter theo search ---
    if (filter.search) {
      const search = filter.search.trim();
      const searchFilter: Prisma.WorkScheduleWhereInput[] = [
        {
          AND: [
            { employee: { firstName: { contains: search.split(' ')[0], mode: 'insensitive' } } },
            {
              employee: { lastName: { contains: search.split(' ')[1] || '', mode: 'insensitive' } },
            },
          ],
        },
        { employee: { account: { email: { contains: search, mode: 'insensitive' } } } },
      ];
      where.OR = where.OR ? [...where.OR, ...searchFilter] : searchFilter;
    }

    // --- Role-based filter STAFF/TECHNICIAN to own schedules only ---
    if ((userRole === AccountRole.STAFF || userRole === AccountRole.TECHNICIAN) && employeeId) {
      const roleRestriction: Prisma.WorkScheduleWhereInput[] = [
        { employeeId },
        {
          shift: {
            serviceCenter: {
              workCenters: {
                some: {
                  employeeId,
                  OR: [{ endDate: null }, { startDate: { gte: new Date() } }],
                },
              },
            },
          },
        },
      ];
      where.OR = where.OR ? [...where.OR, ...roleRestriction] : roleRestriction;
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
        select: {
          id: true,
          date: true,
          createdAt: true,
          updatedAt: true,
          employee: {
            include: {
              account: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  phone: true,
                  avatar: true,
                  createdAt: true,
                  updatedAt: true,
                  employee: {
                    select: {
                      firstName: true,
                      lastName: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                },
              },
            },
          },
          shift: {
            select: {
              id: true,
              name: true,
              startTime: true,
              endTime: true,
              maximumSlot: true,
              status: true,
              createdAt: true,
              updatedAt: true,
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
          },
        },
        orderBy: orderByClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.workSchedule.count({ where }),
    ]);

    return {
      data: workSchedules.map(ws =>
        plainToInstance(WorkScheduleDTO, this.formatShiftTime(ws), {
          excludeExtraneousValues: true,
        })
      ),
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
  ): Promise<WorkScheduleDTO> {
    const workSchedule = await this.prismaService.workSchedule.findUnique({
      where: { id },
      select: {
        id: true,
        date: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          include: {
            account: {
              select: {
                id: true,
                email: true,
                role: true,
                phone: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                employee: {
                  select: {
                    firstName: true,
                    lastName: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        },
        shift: {
          select: {
            id: true,
            centerId: true,
            name: true,
            startTime: true,
            endTime: true,
            maximumSlot: true,
            status: true,
            createdAt: true,
            updatedAt: true,
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
        },
      },
    });

    if (!workSchedule) {
      throw new NotFoundException(`Work schedule with ID ${id} not found`);
    }

    if ((userRole === AccountRole.STAFF || userRole === AccountRole.TECHNICIAN) && employeeId) {
      const isOwnSchedule = workSchedule.employee.account.id === employeeId;

      if (!isOwnSchedule) {
        const isAssignedCenter = await this.prismaService.workCenter.findFirst({
          where: {
            employeeId,
            centerId: workSchedule.shift.centerId,
            OR: [{ endDate: null }, { startDate: { gte: new Date() } }],
          },
        });
        if (!isAssignedCenter) {
          throw new ForbiddenException('Access denied');
        }
      }
    }

    return plainToInstance(WorkScheduleDTO, this.formatShiftTime(workSchedule), {
      excludeExtraneousValues: true,
    });
  }

  private inferRepeatDaysFromSchedules(schedules: any[]): number[] {
    const daySet = new Set<number>();
    schedules.forEach(schedule => {
      daySet.add(schedule.date.getDay());
    });
    return Array.from(daySet).sort();
  }

  async updateCyclicWorkSchedule(
    employeeId: string,
    shiftId: string,
    updateCyclicDto: UpdateCyclicWorkScheduleDTO,
    userRole: AccountRole
  ): Promise<WorkScheduleDTO[]> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update cyclic work schedule assignments');
    }

    // Validate path parameters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const errors: Record<string, string> = {};

    if (!uuidRegex.test(employeeId)) {
      errors.employeeId = 'Employee ID must be a valid UUID';
    }
    if (!uuidRegex.test(shiftId)) {
      errors.shiftId = 'Shift ID must be a valid UUID';
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingSchedules = await this.prismaService.workSchedule.findMany({
      where: { employeeId, shiftId, date: { gte: today } },
      orderBy: { date: 'asc' },
    });

    if (existingSchedules.length === 0) {
      throw new NotFoundException(
        'No future work schedules found for this employee-shift combination'
      );
    }

    const {
      employeeId: newEmployeeId,
      shiftId: newShiftId,
      startDate: startDateStr,
      endDate: endDateStr,
      repeatDays,
    } = updateCyclicDto;

    // --- Validate newEmployeeId (if provided) ---
    let targetEmployee = null;
    if (newEmployeeId !== undefined) {
      if (!newEmployeeId || newEmployeeId.trim() === '') {
        errors.employeeId = 'Employee ID cannot be empty';
      } else if (!uuidRegex.test(newEmployeeId)) {
        errors.employeeId = 'Employee ID must be a valid UUID';
      } else {
        targetEmployee = await this.prismaService.employee.findUnique({
          where: { accountId: newEmployeeId },
          include: { account: true },
        });
        if (!targetEmployee || !targetEmployee.account) {
          errors.employeeId = `Employee with ID ${newEmployeeId} not found`;
        } else if (
          targetEmployee.account.role !== AccountRole.TECHNICIAN &&
          targetEmployee.account.role !== AccountRole.STAFF
        ) {
          errors.employeeId = `Only STAFF and TECHNICIAN employees can be assigned. This employee has role ${targetEmployee.account.role}`;
        }
      }
    }

    // --- Validate newShiftId (if provided) ---
    let targetShift = null;
    if (newShiftId !== undefined) {
      if (!newShiftId || newShiftId.trim() === '') {
        errors.shiftId = 'Shift ID cannot be empty';
      } else if (!uuidRegex.test(newShiftId)) {
        errors.shiftId = 'Shift ID must be a valid UUID';
      } else {
        targetShift = await this.prismaService.shift.findUnique({
          where: { id: newShiftId },
          include: { serviceCenter: true },
        });
        if (!targetShift) {
          errors.shiftId = `Shift with ID ${newShiftId} not found`;
        }
      }
    }

    // --- Validate dates ---
    let newStartDate = existingSchedules[0].date;
    let newEndDate = existingSchedules.at(-1)?.date ?? new Date();

    if (startDateStr !== undefined) {
      if (!startDateStr || startDateStr.trim() === '') {
        errors.startDate = 'Start date cannot be empty';
      } else {
        newStartDate = new Date(startDateStr);
        if (isNaN(newStartDate.getTime())) {
          errors.startDate = 'Start date must be a valid ISO date string';
        } else {
          newStartDate.setHours(0, 0, 0, 0);
        }
      }
    }

    if (endDateStr !== undefined) {
      if (!endDateStr || endDateStr.trim() === '') {
        errors.endDate = 'End date cannot be empty';
      } else {
        newEndDate = new Date(endDateStr);
        if (isNaN(newEndDate.getTime())) {
          errors.endDate = 'End date must be a valid ISO date string';
        } else {
          newEndDate.setHours(0, 0, 0, 0);
        }
      }
    }

    // Validate date range
    if (newStartDate >= newEndDate) {
      errors.dateRange = 'End date must be after start date';
    }

    // --- Validate repeatDays (if provided) ---
    let newRepeatDays = this.inferRepeatDaysFromSchedules(existingSchedules);
    if (repeatDays !== undefined) {
      if (!Array.isArray(repeatDays)) {
        errors.repeatDays = 'Repeat days must be an array';
      } else if (repeatDays.length === 0) {
        errors.repeatDays = 'At least one repeat day is required';
      } else if (repeatDays.length > 7) {
        errors.repeatDays = 'Maximum 7 repeat days allowed';
      } else {
        const invalidDays = repeatDays.filter(day => !Number.isInteger(day) || day < 0 || day > 6);
        if (invalidDays.length > 0) {
          errors.repeatDays = 'Each repeat day must be an integer between 0 and 6';
        } else {
          newRepeatDays = repeatDays;
        }
      }
    }

    // --- Throw all validation errors at once ---
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors,
      });
    }

    // --- Generate target dates ---
    const targetDates: Date[] = [];
    for (let d = new Date(newStartDate); d <= newEndDate; d.setDate(d.getDate() + 1)) {
      if (newRepeatDays.includes(d.getDay())) {
        const normalized = new Date(d);
        normalized.setHours(0, 0, 0, 0);
        targetDates.push(normalized);
      }
    }

    if (targetDates.length === 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { repeatDays: 'No valid dates found for the specified repeat days' },
      });
    }

    const finalEmployeeId = newEmployeeId || employeeId;
    const finalShiftId = newShiftId || shiftId;

    // Check if updating pattern or just employee/shift
    const updatePattern =
      startDateStr !== undefined ||
      endDateStr !== undefined ||
      (repeatDays !== undefined && Array.isArray(repeatDays) && repeatDays.length > 0);

    if (!updatePattern && (newEmployeeId || newShiftId)) {
      // Just update employee/shift for existing future schedules
      await this.prismaService.workSchedule.updateMany({
        where: { employeeId, shiftId, date: { gte: today } },
        data: {
          ...(newEmployeeId && { employeeId: newEmployeeId }),
          ...(newShiftId && { shiftId: newShiftId }),
        },
      });
    } else {
      // Delete old schedules and create new ones with new pattern
      await this.prismaService.workSchedule.deleteMany({
        where: { employeeId, shiftId, date: { gte: today } },
      });

      await this.prismaService.workSchedule.createMany({
        data: targetDates.map(date => ({
          employeeId: finalEmployeeId,
          shiftId: finalShiftId,
          date,
        })),
      });
    }

    // --- Fetch updated schedules ---
    const updatedSchedules = await this.prismaService.workSchedule.findMany({
      where: {
        date: { gte: today },
      },
      include: {
        employee: {
          include: {
            account: {
              select: {
                id: true,
                email: true,
                role: true,
                phone: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                employee: {
                  select: {
                    firstName: true,
                    lastName: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        },
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            maximumSlot: true,
            status: true,
            createdAt: true,
            updatedAt: true,
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
        },
      },
      orderBy: { date: 'asc' },
    });

    return updatedSchedules.map(ws =>
      plainToInstance(WorkScheduleDTO, this.formatShiftTime(ws), {
        excludeExtraneousValues: true,
      })
    );
  }

  async deleteWorkSchedule(
    employeeId: string,
    userRole: AccountRole
  ): Promise<{ deletedCount: number }> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can delete work schedules');
    }

    const employee = await this.prismaService.employee.findUnique({
      where: { accountId: employeeId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const result = await this.prismaService.workSchedule.deleteMany({
      where: { employeeId },
    });

    if (result.count === 0) {
      throw new NotFoundException('No work schedules found for this employee');
    }

    return { deletedCount: result.count };
  }
}
