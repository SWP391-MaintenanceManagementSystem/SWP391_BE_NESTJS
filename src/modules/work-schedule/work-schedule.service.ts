import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkScheduleDTO } from './dto/create-work-schedule.dto';
import { WorkScheduleQueryDTO } from './dto/work-schedule-query.dto';
import { WorkScheduleDTO } from './dto/work-schedule.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { plainToInstance } from 'class-transformer';
import { AccountRole, Prisma, ShiftStatus } from '@prisma/client';
import { dateToString, stringToDate, dateToTimeString } from 'src/utils';
import { UpdateWorkScheduleDTO } from './dto/update-work-schedule.dto';
import { min } from 'class-validator';

@Injectable()
export class WorkScheduleService {
  constructor(private prismaService: PrismaService) {}

  async createWorkSchedule(
    createDto: CreateWorkScheduleDTO,
    userRole: AccountRole
  ): Promise<WorkScheduleDTO[]> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can create work schedule assignments');
    }

    const { employeeIds, shiftId, centerId, startDate, endDate, repeatDays } = createDto;
    const errors: Record<string, any> = {};

    // --- Validate employeeIds ---
    if (!employeeIds || employeeIds.length === 0) {
      errors.employeeIds = 'At least one employee ID is required';
    }

    // --- Determine mode: SINGLE or CYCLIC ---
    const isSingleMode = !!startDate && (!endDate || endDate === startDate || endDate === '');
    const isCyclicMode =
      !!startDate &&
      endDate &&
      endDate !== '' &&
      endDate !== startDate &&
      Array.isArray(repeatDays);

    if (!isSingleMode && !isCyclicMode) {
      errors.mode =
        'Must provide either startDate for single schedule OR startDate, a valid endDate, and repeatDays for cyclic schedule';
    }

    // --- Validate shiftId ---
    const shift = await this.prismaService.shift.findUnique({
      where: { id: shiftId },
      include: { serviceCenter: true },
    });
    if (!shift) {
      errors.shiftId = `Shift with ID ${shiftId} not found`;
    } else if (shift.status !== ShiftStatus.ACTIVE) {
      errors.shiftId = `Cannot create work schedule for inactive shift. Shift status is ${shift.status}`;
    } else if (shift.serviceCenter.id !== centerId) {
      errors.shiftId = `Shift with ID ${shiftId} does not belong to service center with ID ${centerId}`;
    }

    // --- Validate based on mode ---
    let scheduleDates: Date[] = [];

    if (isSingleMode) {
      try {
        if (endDate && endDate !== startDate) {
          errors.date =
            'For single schedule, startDate and endDate must be the same or endDate omitted';
        }
        const parsedDate = stringToDate(startDate!);
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if (parsedDate < today) {
          errors.startDate = 'Cannot create work schedule for past dates';
        } else {
          scheduleDates = [parsedDate];
        }
      } catch (error) {
        errors.startDate = `Invalid date format: ${startDate}. Expected format: YYYY-MM-DD`;
      }
    } else if (isCyclicMode) {
      // CYCLIC MODE - validate date range and repeat days
      let start: Date | null = null;
      let end: Date | null = null;

      try {
        start = stringToDate(startDate!);
      } catch (error) {
        errors.startDate = `Invalid start date format: ${startDate}. Expected format: YYYY-MM-DD`;
      }

      try {
        end = stringToDate(endDate!);
      } catch (error) {
        errors.endDate = `Invalid end date format: ${endDate}. Expected format: YYYY-MM-DD`;
      }

      if (start && end && start > end) {
        errors.dateRange = 'Start date must be before end date';
      }

      if (!Array.isArray(repeatDays)) {
        errors.repeatDays = 'Repeat days must be an array';
      } else if (repeatDays.length === 0) {
        errors.repeatDays = 'At least one repeat day is required';
      } else if (repeatDays.length > 7) {
        errors.repeatDays = 'Maximum 7 repeat days allowed';
      } else {
        const invalidDays = repeatDays.filter(day => !Number.isInteger(day) || day < 0 || day > 6);
        if (invalidDays.length > 0) {
          errors.repeatDays =
            'Each repeat day must be an integer between 0 (Sunday) and 6 (Saturday)';
        }
      }

      if (start && end && repeatDays && repeatDays.length > 0 && Object.keys(errors).length === 0) {
        const ONE_DAY = 24 * 60 * 60 * 1000;
        for (let t = start.getTime(); t <= end.getTime(); t += ONE_DAY) {
          const d = new Date(t);
          if (repeatDays.includes(d.getUTCDay())) {
            scheduleDates.push(d);
          }
        }

        if (scheduleDates.length === 0) {
          errors.repeatDays = 'No valid repeat days within the specified date range';
        }
      }
    }

    // --- Throw all validation errors at once ---
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    // --- Validate all employees ---
    const employeeValidations: { employeeId: string; toCreate: Date[] }[] = [];

    // Batch fetch employees to improve performance
    const employees = await this.prismaService.employee.findMany({
      where: { accountId: { in: employeeIds } },
      include: { account: true },
    });
    const employeeMap = new Map(employees.map(e => [e.accountId, e]));

    for (const employeeId of employeeIds) {
      const employee = employeeMap.get(employeeId);
      if (!employee || !employee.account) {
        errors[employeeId] = `Employee with ID ${employeeId} not found`;
        continue;
      }
      if (
        employee.account.role !== AccountRole.TECHNICIAN &&
        employee.account.role !== AccountRole.STAFF
      ) {
        errors[employeeId] =
          `Only STAFF and TECHNICIAN employees can be assigned. This employee has role ${employee.account.role}`;
        continue;
      }

      const minDate = scheduleDates[0];
      const maxDate = scheduleDates[scheduleDates.length - 1];

      const validShift = shift as NonNullable<typeof shift>;

      const activeAssignment = await this.prismaService.workCenter.findFirst({
        where: {
          employeeId,
          centerId: validShift.serviceCenter.id,
          startDate: { lte: minDate },
          OR: [{ endDate: null }, { endDate: { gte: maxDate } }],
        },
        orderBy: {
          startDate: 'desc',
        },
      });

      if (!activeAssignment) {
        errors[employeeId] = {
          workCenter: `Employee is not assigned to service center ${validShift.serviceCenter.name}. Please assign the employee to this service center first.`,
        };
        continue;
      }

      if (minDate < activeAssignment.startDate) {
        errors[employeeId] = {
          workCenter: `Work schedule start date (${dateToString(minDate)}) is before employee's assignment start date (${dateToString(activeAssignment.startDate)}) to service center ${validShift.serviceCenter.name}. Please adjust the work schedule start date to be on or after ${dateToString(activeAssignment.startDate)}.`,
        };
        continue;
      }

      if (activeAssignment.endDate && maxDate > activeAssignment.endDate) {
        errors[employeeId] = {
          workCenter: `Work schedule end date (${dateToString(maxDate)}) is after employee's assignment end date (${dateToString(activeAssignment.endDate)}) to service center "${validShift.serviceCenter.name}". Please adjust the work schedule end date to be on or before ${dateToString(activeAssignment.endDate)} or extend the assignment.`,
        };
        continue;
      }

      // --- Check for existing schedules to avoid duplicates ---
      const existingSchedules = await this.prismaService.workSchedule.findMany({
        where: {
          employeeId,
          shiftId,
          date: { in: scheduleDates },
        },
        select: { date: true },
      });

      const existingDates = new Set(existingSchedules.map(e => e.date.toISOString().slice(0, 10)));
      const toCreate = scheduleDates.filter(d => {
        const key = d.toISOString().slice(0, 10);
        return !existingDates.has(key);
      });

      if (toCreate.length === 0) {
        errors[employeeId] = {
          date: 'Work schedules already exist for all the specified dates for this employee and shift',
        };
        continue;
      }

      employeeValidations.push({ employeeId, toCreate });
    }

    // --- Throw all validation errors at once ---
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    // --- Create work schedules in a transaction ---
    const createdSchedules: WorkScheduleDTO[] = await this.prismaService.$transaction(
      async prisma => {
        const schedules: WorkScheduleDTO[] = [];

        for (const { employeeId, toCreate } of employeeValidations) {
          await prisma.workSchedule.createMany({
            data: toCreate.map(date => ({
              employeeId,
              shiftId,
              date,
            })),
          });

          const created = await prisma.workSchedule.findMany({
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

          const formatted = created.map(ws =>
            plainToInstance(
              WorkScheduleDTO,
              {
                ...ws,
                date: dateToString(ws.date),
                shift: ws.shift
                  ? {
                      ...ws.shift,
                      startTime: dateToTimeString(ws.shift.startTime),
                      endTime: dateToTimeString(ws.shift.endTime),
                    }
                  : undefined,
              },
              { excludeExtraneousValues: true }
            )
          );
          schedules.push(...formatted);
        }

        return schedules;
      }
    );

    return createdSchedules;
  }

  async getWorkSchedules(
    filter: WorkScheduleQueryDTO,
    userRole: AccountRole,
    employeeId?: string
  ): Promise<PaginationResponse<WorkScheduleDTO>> {
    let { page = 1, pageSize = 10, sortBy = 'createdAt', orderBy = 'desc' } = filter;
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

    const orderByClause: Prisma.WorkScheduleOrderByWithRelationInput[] = [];
    if (sortBy === 'employee') {
      orderByClause.push({ employee: { firstName: orderBy } }, { id: 'asc' });
    } else if (sortBy === 'shift') {
      orderByClause.push({ shift: { name: orderBy } }, { id: 'asc' });
    } else if (sortBy === 'fullName') {
      orderByClause.push(
        { employee: { firstName: orderBy } },
        { employee: { lastName: orderBy } },
        { id: 'asc' }
      );
    } else {
      orderByClause.push(
        { [sortBy as keyof Prisma.WorkScheduleOrderByWithRelationInput]: orderBy },
        { id: 'asc' }
      );
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

    let sortedSchedules = workSchedules;
    if (sortBy === 'fullName') {
      sortedSchedules = [...workSchedules].sort((a, b) => {
        const aEmp = a.employee?.account?.employee;
        const bEmp = b.employee?.account?.employee;
        const fullA = `${aEmp?.firstName ?? ''} ${aEmp?.lastName ?? ''}`.trim().toLowerCase();
        const fullB = `${bEmp?.firstName ?? ''} ${bEmp?.lastName ?? ''}`.trim().toLowerCase();
        return orderBy === 'asc' ? fullA.localeCompare(fullB) : fullB.localeCompare(fullA);
      });
    }

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
                  startTime: dateToTimeString(ws.shift.startTime),
                  endTime: dateToTimeString(ws.shift.endTime),
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

              startTime: dateToTimeString(workSchedule.shift.startTime),
              endTime: dateToTimeString(workSchedule.shift.endTime),
            }
          : undefined,
      },
      {
        excludeExtraneousValues: true,
      }
    );
  }

  async updateWorkSchedule(
    id: string,
    updateDto: UpdateWorkScheduleDTO,
    userRole: AccountRole
  ): Promise<WorkScheduleDTO> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update work schedule assignments');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const errors: Record<string, string> = {};

    // --- Validate ID parameter ---
    if (!id || id.trim() === '') {
      errors.id = 'Work schedule ID is required and cannot be empty';
    } else if (!uuidRegex.test(id)) {
      errors.id = 'Work schedule ID must be a valid UUID';
    }

    if (errors.id) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors,
      });
    }

    // --- Check if work schedule exists ---
    const existingSchedule = await this.prismaService.workSchedule.findUnique({
      where: { id },
      include: {
        shift: {
          include: { serviceCenter: true },
        },
        employee: {
          include: { account: true },
        },
      },
    });

    if (!existingSchedule) {
      throw new NotFoundException(`Work schedule with ID ${id} not found`);
    }

    const { employeeId, shiftId, date } = updateDto;

    // --- Set final values (default to existing if not provided) ---
    let finalEmployeeId = existingSchedule.employeeId;
    let finalShiftId = existingSchedule.shiftId;
    let finalShift = existingSchedule.shift;
    let parsedDate = existingSchedule.date;
    let dateString = dateToString(existingSchedule.date);

    // --- Validate newEmployeeId (if provided) ---
    if (employeeId !== undefined) {
      if (!employeeId || employeeId.trim() === '') {
        errors.employeeId = 'Employee ID cannot be empty';
      } else if (!uuidRegex.test(employeeId)) {
        errors.employeeId = 'Employee ID must be a valid UUID';
      } else {
        const targetEmployee = await this.prismaService.employee.findUnique({
          where: { accountId: employeeId },
          include: { account: true },
        });
        if (!targetEmployee || !targetEmployee.account) {
          errors.employeeId = `Employee with ID ${employeeId} not found`;
        } else if (
          targetEmployee.account.role !== AccountRole.TECHNICIAN &&
          targetEmployee.account.role !== AccountRole.STAFF
        ) {
          errors.employeeId = `Only STAFF and TECHNICIAN employees can be assigned. This employee has role ${targetEmployee.account.role}`;
        } else {
          finalEmployeeId = employeeId;
        }
      }
    }

    // --- Validate newShiftId (if provided) ---
    if (!shiftId || shiftId.trim() === '') {
      errors.shiftId = 'Shift ID cannot be empty';
    } else if (!uuidRegex.test(shiftId)) {
      errors.shiftId = 'Shift ID must be a valid UUID';
    } else {
      const targetShift = await this.prismaService.shift.findUnique({
        where: { id: shiftId },
        include: { serviceCenter: true },
      });
      if (!targetShift) {
        errors.shiftId = `Shift with ID ${shiftId} not found`;
      } else if (targetShift.status !== ShiftStatus.ACTIVE) {
        errors.shiftId = `Cannot update to inactive shift. Shift status is ${targetShift.status}`;
      } else {
        // Check if shift belongs to a service center where employee is assigned
        const activeAssignment = await this.prismaService.workCenter.findMany({
          where: {
            employeeId: finalEmployeeId,
            startDate: { lte: parsedDate },
            OR: [{ endDate: null }, { endDate: { gte: parsedDate } }],
          },
          include: { serviceCenter: true },
        });
        const sameCenterWithShift = activeAssignment.find(
          a => a.centerId === targetShift.serviceCenter.id
        );
        if (!sameCenterWithShift) {
          const availableCenters = activeAssignment.map(a => a.serviceCenter.name).join(', ');
          errors.shiftId =
            activeAssignment.length > 0
              ? `Shift with ID ${shiftId} belongs to service center ${targetShift.serviceCenter.name}, but employee is assigned to: ${availableCenters} on ${dateString}`
              : `Shift with ID ${shiftId} belongs to service center ${targetShift.serviceCenter.name}, but employee has no service center assignment on ${dateString}`;
        } else {
          finalShiftId = shiftId;
          finalShift = targetShift;
        }
      }
    }

    // --- Validate and parse date (if provided) ---
    if (date !== undefined) {
      if (!date || date.trim() === '') {
        errors.date = 'Date cannot be empty';
      } else {
        try {
          parsedDate = stringToDate(date);
          dateString = date;

          // Check if date is in the past
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);
          if (parsedDate < today) {
            errors.date = 'Cannot update work schedule to past dates';
          }
        } catch (error) {
          errors.date = `Invalid date format: "${date}". Expected format: YYYY-MM-DD`;
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

    // --- Check if employee has active work center assignment for the final date ---
    const activeAssignment = await this.prismaService.workCenter.findMany({
      where: {
        employeeId: finalEmployeeId,
        startDate: { lte: parsedDate },
        OR: [{ endDate: null }, { endDate: { gte: parsedDate } }],
      },
      include: { serviceCenter: true },
    });

    const sameCenterWithShift = activeAssignment.find(a => a.centerId === finalShift.centerId);

    if (!sameCenterWithShift) {
      const availableCenters = activeAssignment.map(a => a.serviceCenter.name).join(', ');
      const errorMsg =
        activeAssignment.length > 0
          ? `Employee is assigned to: ${availableCenters} on ${dateString}. Cannot update to shift at ${finalShift.serviceCenter.name}. Please choose a shift from an assigned service center or assign employee to this center first.`
          : `Employee has no service center assignment on ${dateString}. Please assign to ${finalShift.serviceCenter.name} first.`;

      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          workCenter: errorMsg,
        },
      });
    }

    // Check if date is before assignment start
    if (parsedDate < sameCenterWithShift.startDate) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          workCenter: `Work schedule date (${dateString}) is before employee's assignment start date (${dateToString(sameCenterWithShift.startDate)}) to service center ${finalShift.serviceCenter.name}. Please adjust the date to be on or after ${dateToString(sameCenterWithShift.startDate)}.`,
        },
      });
    }

    if (sameCenterWithShift.endDate && parsedDate > sameCenterWithShift.endDate) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: {
          workCenter: `Work schedule date (${dateString}) is after employee's assignment end date (${dateToString(sameCenterWithShift.endDate)}) to service center ${finalShift.serviceCenter.name}. Please adjust the date to be on or before ${dateToString(sameCenterWithShift.endDate)}.`,
        },
      });
    }

    // --- Check for duplicate schedule (exclude current record) ---
    if (employeeId !== undefined || shiftId !== undefined || date !== undefined) {
      const duplicateSchedule = await this.prismaService.workSchedule.findFirst({
        where: {
          id: { not: id },
          employeeId: finalEmployeeId,
          shiftId: finalShiftId,
          date: parsedDate,
        },
      });

      if (duplicateSchedule) {
        throw new ConflictException({
          message: 'Validation failed',
          errors: {
            date: 'Work schedules already exist for all the specified dates for this employee and shift',
          },
        });
      }
    }

    // --- Update ONLY this work schedule by ID ---
    const updated = await this.prismaService.workSchedule.update({
      where: { id },
      data: {
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

    return plainToInstance(
      WorkScheduleDTO,
      {
        ...updated,
        date: dateToString(updated.date),
        shift: updated.shift
          ? {
              ...updated.shift,
              startTime: dateToTimeString(updated.shift.startTime),
              endTime: dateToTimeString(updated.shift.endTime),
            }
          : undefined,
      },
      { excludeExtraneousValues: true }
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

    // --- Validate date ---
    let parsedDate: Date | null = null;
    if (!date || date.trim() === '') {
      errors.date = 'Date is required and cannot be empty';
    } else {
      try {
        parsedDate = stringToDate(date);
      } catch {
        errors.date = `Invalid date format: "${date}". Expected format: YYYY-MM-DD`;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors,
      });
    }

    const result = await this.prismaService.workSchedule.deleteMany({
      where: {
        employeeId,
        date: parsedDate!,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        `No work schedules found for employee ID ${employeeId} on date ${date}`
      );
    }

    return { deletedCount: result.count };
  }
}
