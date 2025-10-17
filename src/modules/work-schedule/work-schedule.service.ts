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
import { RuleTester } from 'eslint';

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

    const shift = await this.prismaService.shift.findUnique({
      where: { id: shiftId },
      include: { serviceCenter: true },
    });
    if (!shift) throw new NotFoundException(`Shift with ID ${shiftId} not found`);

    const employee = await this.prismaService.employee.findUnique({
      where: { accountId: employeeId },
      include: { account: true },
    });
    if (!employee || !employee.account) throw new BadRequestException('Employee not found');

    if (
      employee.account.role !== AccountRole.TECHNICIAN &&
      employee.account.role !== AccountRole.STAFF
    ) {
      throw new BadRequestException('Only STAFF and TECHNICIAN employees can be assigned');
    }

    const start = this.normalizeDate(startDate);
    const end = this.normalizeDate(endDate);
    if (start > end)
      throw new BadRequestException('Start date must be before or equal to end date');

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const scheduleDates: Date[] = [];

    for (let t = start.getTime(); t <= end.getTime(); t += ONE_DAY) {
      const d = new Date(t);
      if (repeatDays.includes(d.getUTCDay())) scheduleDates.push(d);
    }

    if (scheduleDates.length === 0)
      throw new BadRequestException('No valid repeat days within range');

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
      return !shift.maximumSlot || currentCount < shift.maximumSlot;
    });

    if (toCreate.length === 0)
      throw new ConflictException('No new schedules can be created (all full or exist)');

    const activeAssignment = await this.prismaService.workCenter.findFirst({
      where: {
        employeeId: createCyclicDto.employeeId,
        centerId: shift?.centerId,
        startDate: { lte: end },
        OR: [{ endDate: null }, { endDate: { gte: start } }],
      },
      include: { serviceCenter: true },
    });

    if (!activeAssignment) {
      throw new BadRequestException(
        'Employee does not have an active work center assignment for the shift'
      );
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
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
        shift: {
          select: {
            centerId: true,
            name: true,
            startTime: true,
            endTime: true,
            maximumSlot: true,
            status: true,
            createdAt: true,
            updatedAt: true,
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

    // Role-based filter
    if ((userRole === AccountRole.STAFF || userRole === AccountRole.TECHNICIAN) && employeeId) {
      where.OR = [
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

    const newEmployeeId = updateCyclicDto.employeeId || employeeId;
    const newShiftId = updateCyclicDto.shiftId || shiftId;

    const newStartDate = updateCyclicDto.startDate
      ? new Date(updateCyclicDto.startDate)
      : existingSchedules[0].date;

    const newEndDate = updateCyclicDto.endDate
      ? new Date(updateCyclicDto.endDate)
      : (existingSchedules.at(-1)?.date ?? new Date());

    const newRepeatDays =
      updateCyclicDto.repeatDays || this.inferRepeatDaysFromSchedules(existingSchedules);

    newStartDate.setHours(0, 0, 0, 0);
    newEndDate.setHours(0, 0, 0, 0);

    if (newStartDate >= newEndDate) {
      throw new BadRequestException('Start date must be before end date');
    }
    const targetDates: Date[] = [];
    for (let d = new Date(newStartDate); d <= newEndDate; d.setDate(d.getDate() + 1)) {
      if (newRepeatDays.includes(d.getDay())) {
        const normalized = new Date(d);
        normalized.setHours(0, 0, 0, 0);
        targetDates.push(normalized);
      }
    }

    if (targetDates.length === 0) {
      throw new BadRequestException('No valid dates found for the specified repeat days');
    }

    const shift = await this.prismaService.shift.findUnique({
      where: { id: newShiftId },
    });
    if (!shift) throw new NotFoundException(`Shift with ID ${newShiftId} not found`);

    const UpdatePattern =
      !!updateCyclicDto.startDate ||
      !!updateCyclicDto.endDate ||
      (Array.isArray(updateCyclicDto.repeatDays) && updateCyclicDto.repeatDays.length > 0);

    if (!UpdatePattern && (updateCyclicDto.employeeId || updateCyclicDto.shiftId)) {
      await this.prismaService.workSchedule.updateMany({
        where: { employeeId, shiftId, date: { gte: today } },
        data: {
          ...(updateCyclicDto.employeeId && { employeeId: updateCyclicDto.employeeId }),
          ...(updateCyclicDto.shiftId && { shiftId: updateCyclicDto.shiftId }),
        },
      });
    } else {
      await this.prismaService.workSchedule.deleteMany({
        where: { employeeId, shiftId, date: { in: targetDates } },
      });

      await this.prismaService.workSchedule.createMany({
        data: targetDates.map(date => ({
          employeeId: newEmployeeId,
          shiftId: newShiftId,
          date,
        })),
      });
    }

    const updatedSchedules = await this.prismaService.workSchedule.findMany({
      where: {
        employeeId: newEmployeeId,
        shiftId: newShiftId,
        date: { in: targetDates },
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
            centerId: true,
            name: true,
            startTime: true,
            endTime: true,
            maximumSlot: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
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
