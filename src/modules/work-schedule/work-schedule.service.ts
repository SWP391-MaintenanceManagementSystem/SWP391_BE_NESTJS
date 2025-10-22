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
import { CreateWorkScheduleDTO } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDTO } from './dto/update-work-schedule.dto';
import { WorkScheduleQueryDTO } from './dto/work-schedule-query.dto';
import { WorkScheduleDTO } from './dto/work-schedule.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { plainToInstance } from 'class-transformer';
import { AccountRole, Prisma, ShiftStatus } from '@prisma/client';
import {
  dateToString,
  stringToDate,
  dateToTimeString,
  timeStringToDate,
  utcToVNDate,
} from 'src/utils';

@Injectable()
export class WorkScheduleService {
  constructor(private prismaService: PrismaService) {}

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
        } else if (shift.status !== ShiftStatus.ACTIVE) {
          errors.shiftId = `Shift with ID ${shiftId} is not active`;
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
      plainToInstance(WorkScheduleDTO, {
        ...ws,
        date: dateToString(ws.date),
        shift: ws.shift
          ? {
              ...ws.shift,
              startTime: dateToTimeString(utcToVNDate(ws.shift.startTime)),
              endTime: dateToTimeString(utcToVNDate(ws.shift.endTime)),
            }
          : undefined,
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
        plainToInstance(
          WorkScheduleDTO,
          {
            ...ws,
            date: dateToString(ws.date),
            shift: ws.shift
              ? {
                  ...ws.shift,
                  startTime: dateToTimeString(utcToVNDate(ws.shift.startTime)),
                  endTime: dateToTimeString(utcToVNDate(ws.shift.endTime)),
                }
              : undefined,
          },
          {
            excludeExtraneousValues: true,
          }
        )
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

    return plainToInstance(
      WorkScheduleDTO,
      {
        ...workSchedule,
        date: dateToString(workSchedule.date),
        shift: workSchedule.shift
          ? {
              ...workSchedule.shift,

              startTime: dateToTimeString(utcToVNDate(workSchedule.shift.startTime)),
              endTime: dateToTimeString(utcToVNDate(workSchedule.shift.endTime)),
            }
          : undefined,
      },
      {
        excludeExtraneousValues: true,
      }
    );
  }

  async updateCyclicWorkSchedule(
    employeeId: string,
    shiftId: string,
    date: string,
    updateCyclicDto: UpdateCyclicWorkScheduleDTO,
    userRole: AccountRole
  ): Promise<WorkScheduleDTO[]> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update work schedule assignments');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const errors: Record<string, string> = {};

    // --- Validate path parameters ---
    if (!employeeId || employeeId.trim() === '') {
      errors.employeeId = 'Employee ID is required and cannot be empty';
    } else if (!uuidRegex.test(employeeId)) {
      errors.employeeId = 'Employee ID must be a valid UUID';
    }

    if (!shiftId || shiftId.trim() === '') {
      errors.shiftId = 'Shift ID is required and cannot be empty';
    } else if (!uuidRegex.test(shiftId)) {
      errors.shiftId = 'Shift ID must be a valid UUID';
    }

    // ✅ Parse date without adding to errors object
    let parsedDate: Date;
    try {
      parsedDate = stringToDate(date);
    } catch (error) {
      throw new BadRequestException(`Invalid date format: "${date}". Expected format: YYYY-MM-DD`);
    }

    // --- Validate current shift exists ---
    let currentShift = null;
    if (shiftId && uuidRegex.test(shiftId)) {
      currentShift = await this.prismaService.shift.findUnique({
        where: { id: shiftId },
        include: { serviceCenter: true },
      });
      if (!currentShift) {
        errors.shiftId = `Shift with ID ${shiftId} not found`;
      }
    }

    // --- Validate current employee exists ---
    if (employeeId && uuidRegex.test(employeeId)) {
      const currentEmployee = await this.prismaService.employee.findUnique({
        where: { accountId: employeeId },
      });
      if (!currentEmployee) {
        errors.employeeId = `Employee with ID ${employeeId} not found`;
      }
    }

    // --- Validate newEmployeeId (if provided) ---
    const { employeeId: newEmployeeId, shiftId: newShiftId } = updateCyclicDto;
    let targetEmployee = null;
    if (newEmployeeId !== undefined) {
      if (!newEmployeeId || newEmployeeId.trim() === '') {
        errors.newEmployeeId = 'New employee ID cannot be empty';
      } else if (!uuidRegex.test(newEmployeeId)) {
        errors.newEmployeeId = 'New employee ID must be a valid UUID';
      } else {
        targetEmployee = await this.prismaService.employee.findUnique({
          where: { accountId: newEmployeeId },
          include: { account: true },
        });
        if (!targetEmployee || !targetEmployee.account) {
          errors.newEmployeeId = `Employee with ID ${newEmployeeId} not found`;
        } else if (
          targetEmployee.account.role !== AccountRole.TECHNICIAN &&
          targetEmployee.account.role !== AccountRole.STAFF
        ) {
          errors.newEmployeeId = `Only STAFF and TECHNICIAN employees can be assigned. This employee has role ${targetEmployee.account.role}`;
        }
      }
    }

    // --- Validate newShiftId (if provided) ---
    let targetShift = null;
    if (newShiftId !== undefined) {
      if (!newShiftId || newShiftId.trim() === '') {
        errors.newShiftId = 'New shift ID cannot be empty';
      } else if (!uuidRegex.test(newShiftId)) {
        errors.newShiftId = 'New shift ID must be a valid UUID';
      } else {
        targetShift = await this.prismaService.shift.findUnique({
          where: { id: newShiftId },
          include: { serviceCenter: true },
        });
        if (!targetShift) {
          errors.newShiftId = `Shift with ID ${newShiftId} not found`;
        } else if (targetShift.status !== ShiftStatus.ACTIVE) {
          errors.newShiftId = `Cannot update to inactive shift. Shift status is ${targetShift.status}`;
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

    // --- Check if schedule exists ---
    const existingSchedule = await this.prismaService.workSchedule.findFirst({
      where: {
        employeeId,
        shiftId,
        date: parsedDate,
      },
    });

    if (!existingSchedule) {
      throw new NotFoundException(
        `No work schedule found for employee ID ${employeeId}, shift ID ${shiftId} on date ${date}`
      );
    }

    // --- Determine final values ---
    const finalEmployeeId = newEmployeeId || employeeId;
    const finalShiftId = newShiftId || shiftId;
    const finalShift = targetShift || currentShift;

    // --- Check if new employee has active work center assignment for the target shift ---
    if (finalShift && parsedDate) {
      const activeAssignment = await this.prismaService.workCenter.findFirst({
        where: {
          employeeId: finalEmployeeId,
          centerId: finalShift.centerId,
          startDate: { lte: parsedDate },
          OR: [{ endDate: null }, { endDate: { gte: parsedDate } }],
        },
      });

      if (!activeAssignment) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: {
            workCenter: `Employee is not assigned to service center "${finalShift.serviceCenter.name}" on ${date}. Please assign the employee to this service center first.`,
          },
        });
      }
    }

    // --- Update the schedule ---
    await this.prismaService.workSchedule.updateMany({
      where: {
        employeeId,
        shiftId,
        date: parsedDate,
      },
      data: {
        employeeId: finalEmployeeId,
        shiftId: finalShiftId,
      },
    });

    // --- Fetch updated schedule ---
    const updatedSchedules = await this.prismaService.workSchedule.findMany({
      where: {
        employeeId: finalEmployeeId,
        shiftId: finalShiftId,
        date: parsedDate,
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
    });

    return updatedSchedules.map(ws =>
      plainToInstance(
        WorkScheduleDTO,
        {
          ...ws,
          date: dateToString(ws.date),
          shift: ws.shift
            ? {
                ...ws.shift,
                startTime: dateToTimeString(utcToVNDate(ws.shift.startTime)),
                endTime: dateToTimeString(utcToVNDate(ws.shift.endTime)),
              }
            : undefined,
        },
        { excludeExtraneousValues: true }
      )
    );
  }

  async deleteWorkSchedule(
    employeeId: string,
    date: string,
    userRole: AccountRole
  ): Promise<{ deletedCount: number }> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can delete work schedules');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const errors: Record<string, string> = {};

    // --- Validate employeeId ---
    if (!employeeId || employeeId.trim() === '') {
      errors.employeeId = 'Employee ID is required and cannot be empty';
    } else if (!uuidRegex.test(employeeId)) {
      errors.employeeId = 'Employee ID must be a valid UUID';
    } else {
      const employee = await this.prismaService.employee.findUnique({
        where: { accountId: employeeId },
      });
      if (!employee) {
        errors.employeeId = `Employee with ID ${employeeId} not found`;
      }
    }

    // --- Throw validation errors ---
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors,
      });
    }

    // ✅ Parse date separately - throw immediately if invalid
    let parsedDate: Date;
    try {
      parsedDate = stringToDate(date);
    } catch (error) {
      throw new BadRequestException(`Invalid date format: "${date}". Expected format: YYYY-MM-DD`);
    }

    // --- Delete work schedule ---
    const result = await this.prismaService.workSchedule.deleteMany({
      where: {
        employeeId,
        date: parsedDate,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        `No work schedules found for employee ID ${employeeId} on date ${date}`
      );
    }

    return { deletedCount: result.count };
  }

  async createSingleWorkSchedule(
    createDto: CreateWorkScheduleDTO,
    userRole: AccountRole
  ): Promise<WorkScheduleDTO> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can create work schedule assignments');
    }

    const { employeeId, shiftId, date } = createDto;
    const errors: Record<string, string> = {};

    // --- Validate employeeId ---
    let employee = null;
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

    // --- Validate shiftId ---
    let shift = null;
    shift = await this.prismaService.shift.findUnique({
      where: { id: shiftId },
      include: { serviceCenter: true },
    });
    if (!shift) {
      errors.shiftId = `Shift with ID ${shiftId} not found`;
    } else if (shift.status !== ShiftStatus.ACTIVE) {
      errors.shiftId = `Cannot create work schedule for inactive shift. Shift status is ${shift.status}`;
    }

    // --- Validate and parse date ---
    let parsedDate: Date;
    try {
      parsedDate = stringToDate(date);

      // Check if date is in the past
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (parsedDate < today) {
        errors.date = 'Cannot create work schedule for past dates';
      }
    } catch (error) {
      errors.date = `Invalid date format: "${date}". Expected format: YYYY-MM-DD`;
    }

    // --- Check if work center assignment exists ---
    const activeAssignment = await this.prismaService.workCenter.findFirst({
      where: {
        employeeId,
        centerId: shift!.centerId,
        startDate: { lte: parsedDate! },
        OR: [{ endDate: null }, { endDate: { gte: parsedDate! } }],
      },
    });

    if (!activeAssignment) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          workCenter: `Employee is not assigned to service center "${shift!.serviceCenter.name}" on ${date}. Please assign the employee to this service center first.`,
        },
      });
    }

    // --- Check if schedule already exists ---
    const existingSchedule = await this.prismaService.workSchedule.findFirst({
      where: {
        employeeId,
        shiftId,
        date: parsedDate!,
      },
    });

    if (existingSchedule) {
      throw new ConflictException({
        message: 'Validation failed',
        errors: {
          schedule: `Work schedule already exists for this employee on ${date} for this shift`,
        },
      });
    }

    // --- Throw all validation errors at once ---
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors,
      });
    }

    // --- Create work schedule ---
    const created = await this.prismaService.workSchedule.create({
      data: {
        employeeId,
        shiftId,
        date: parsedDate!,
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
    });

    return plainToInstance(
      WorkScheduleDTO,
      {
        ...created,
        date: dateToString(created.date),
        shift: created.shift
          ? {
              ...created.shift,
              startTime: dateToTimeString(utcToVNDate(created.shift.startTime)),
              endTime: dateToTimeString(utcToVNDate(created.shift.endTime)),
            }
          : undefined,
      },
      { excludeExtraneousValues: true }
    );
  }

  // async updateSingleWorkSchedule() {}
}
