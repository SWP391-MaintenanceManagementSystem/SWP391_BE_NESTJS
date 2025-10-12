import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkScheduleDTO } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDTO } from './dto/update-work-schedule.dto';
import { WorkScheduleQueryDTO } from './dto/work-schedule-query.dto';
import { WorkScheduleDTO } from './dto/work-schedule.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { plainToInstance } from 'class-transformer';
import { AccountRole, Prisma } from '@prisma/client';

@Injectable()
export class WorkScheduleService {
  constructor(private prismaService: PrismaService) {}

  async createWorkSchedule(
    createWorkScheduleDto: CreateWorkScheduleDTO,
    userRole: AccountRole,
    currentUser?: string
  ): Promise<WorkScheduleDTO[]> {
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

    const targetDate = new Date(createWorkScheduleDto.date);

    // Validate employee
    const employee = await this.prismaService.employee.findUnique({
      where: { accountId: createWorkScheduleDto.employeeId },
      include: { account: true },
    });

    if (!employee || !employee.account) {
      throw new BadRequestException('Employee not found');
    }

    if (
      employee.account.role !== AccountRole.TECHNICIAN &&
      employee.account.role !== AccountRole.STAFF
    ) {
      throw new BadRequestException('Only STAFF and TECHNICIAN employees can be assigned');
    }

    // Check capacity
    const existingCount = await this.prismaService.workSchedule.count({
      where: {
        shiftId: createWorkScheduleDto.shiftId,
        date: targetDate,
      },
    });

    if (shift.maximumSlot && existingCount >= shift.maximumSlot) {
      throw new ConflictException(
        `Shift capacity exceeded on ${targetDate.toDateString()}. Max: ${shift.maximumSlot}, Current: ${existingCount}`
      );
    }

    // Check duplicate assignment
    const existingSchedule = await this.prismaService.workSchedule.findFirst({
      where: {
        shiftId: createWorkScheduleDto.shiftId,
        date: targetDate,
        employeeId: createWorkScheduleDto.employeeId,
      },
    });

    if (existingSchedule) {
      throw new ConflictException(
        `Employee is already assigned to this shift on ${targetDate.toDateString()}`
      );
    }

    // Create schedule
    const workSchedule = await this.prismaService.workSchedule.create({
      data: {
        employeeId: createWorkScheduleDto.employeeId,
        shiftId: createWorkScheduleDto.shiftId,
        date: targetDate,
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
          include: { serviceCenter: true },
        },
      },
    });

    return [plainToInstance(WorkScheduleDTO, workSchedule, { excludeExtraneousValues: true })];
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
                  endDate: { gte: new Date() },
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
          shift: { include: { serviceCenter: true } },
        },
        orderBy: orderByClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.workSchedule.count({ where }),
    ]);

    return {
      data: workSchedules.map(ws =>
        plainToInstance(WorkScheduleDTO, ws, { excludeExtraneousValues: true })
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
        shift: { include: { serviceCenter: true } },
      },
    });

    if (!workSchedule) {
      throw new NotFoundException(`Work schedule with ID ${id} not found`);
    }

    if ((userRole === AccountRole.STAFF || userRole === AccountRole.TECHNICIAN) && employeeId) {
      const isOwnSchedule = workSchedule.employeeId === employeeId;

      if (!isOwnSchedule) {
        const isAssignedCenter = await this.prismaService.workCenter.findFirst({
          where: {
            employeeId,
            centerId: workSchedule.shift.centerId,
            endDate: { gte: new Date() },
          },
        });
        if (!isAssignedCenter) {
          throw new ForbiddenException('Access denied');
        }
      }
    }

    return plainToInstance(WorkScheduleDTO, workSchedule, {
      excludeExtraneousValues: true,
    });
  }

  async updateWorkSchedule(
    shiftId: string,
    date: string,
    updateDto: UpdateWorkScheduleDTO,
    userRole: AccountRole
  ): Promise<WorkScheduleDTO[]> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update work schedule assignments');
    }

    const targetDate = new Date(date);

    const existingSchedules = await this.prismaService.workSchedule.findMany({
      where: { shiftId, date: targetDate },
      include: {
        employee: { include: { account: true } },
        shift: { include: { serviceCenter: true } },
      },
    });

    if (existingSchedules.length === 0) {
      throw new NotFoundException(`No work schedules found for shift ${shiftId} on ${date}`);
    }

    if (updateDto.employeeId) {
      const newEmployee = await this.prismaService.employee.findUnique({
        where: { accountId: updateDto.employeeId },
        include: { account: true },
      });

      if (!newEmployee || !newEmployee.account) {
        throw new BadRequestException('New employee not found');
      }

      if (
        newEmployee.account.role !== AccountRole.TECHNICIAN &&
        newEmployee.account.role !== AccountRole.STAFF
      ) {
        throw new BadRequestException('Only STAFF and TECHNICIAN employees can be assigned');
      }

      await this.prismaService.$transaction([
        this.prismaService.workSchedule.deleteMany({
          where: { shiftId, date: targetDate },
        }),
        this.prismaService.workSchedule.create({
          data: {
            employeeId: updateDto.employeeId,
            shiftId,
            date: targetDate,
          },
        }),
      ]);
    }

    const updatedSchedules = await this.prismaService.workSchedule.findMany({
      where: { shiftId, date: targetDate },
      include: {
        employee: { include: { account: true } },
        shift: { include: { serviceCenter: true } },
      },
    });

    return updatedSchedules.map(ws =>
      plainToInstance(WorkScheduleDTO, ws, { excludeExtraneousValues: true })
    );
  }

  async deleteWorkSchedule(id: string, userRole: AccountRole): Promise<void> {
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

    await this.prismaService.workSchedule.delete({ where: { id } });
  }
}
