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
  async createWorkSchedule(
    createWorkScheduleDto: CreateWorkScheduleDto,
    userRole: AccountRole,
    employeeId?: string
  ): Promise<WorkScheduleDto[]> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can create work schedules');
    }

    const shift = await this.prismaService.shift.findUnique({
      where: { id: createWorkScheduleDto.shiftId },
      include: { serviceCenter: true },
    });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${createWorkScheduleDto.shiftId} not found`);
    }

    const employees = await this.prismaService.employee.findMany({
      where: {
        accountId: { in: createWorkScheduleDto.employeeId },
        account: {
          role: {
            in: [AccountRole.TECHNICIAN, AccountRole.STAFF]
          }
        }
      },
      include: { account: true }
    });

    if (employees.length !== createWorkScheduleDto.employeeId.length) {
      throw new BadRequestException('Some employee IDs are invalid or not STAFF/TECHNICIAN');
    }

    const existingAssignments = await this.prismaService.workSchedule.count({
      where: {
        shiftId: createWorkScheduleDto.shiftId,
      }
    });

    const newTotal = existingAssignments + createWorkScheduleDto.employeeId.length;
    if (shift.maximumSlot !== null && newTotal > shift.maximumSlot) {
      throw new ConflictException(`Cannot assign employees. Maximum slot of ${shift.maximumSlot} for this shift will be exceeded.`);
    }

    const existingSchedules = await this.prismaService.workSchedule.findMany({
      where: {
        shiftId: createWorkScheduleDto.shiftId,
        employeeId: { in: createWorkScheduleDto.employeeId },
        date: new Date(createWorkScheduleDto.date),
      }
    });

    if (existingSchedules.length > 0) {
      const existingEmployeeIds = existingSchedules.map(schedule => schedule.employeeId);
      throw new ConflictException(`Employees with IDs ${existingEmployeeIds.join(', ')} are already assigned to this shift.`);
    }

    const workSchedules = await this.prismaService.$transaction(
      createWorkScheduleDto.employeeId.map(employeeId =>
        this.prismaService.workSchedule.create({
          data: {
            employeeId: employeeId,
            shiftId: createWorkScheduleDto.shiftId,
            date: new Date(createWorkScheduleDto.date),
          },
          include: {
            employee: {
              include: { account: true }
            },
            shift: {
              include: { serviceCenter: true }
            }
          }
        })
      )
    );

    return workSchedules.map(ws => plainToInstance(WorkScheduleDto, ws));
  }

  async getWorkSchedules(filter: WorkScheduleQueryDto, userRole: AccountRole, employeeId?: string): Promise<PaginationResponse<WorkScheduleDto>> {
    let { page = 1, pageSize = 10, sortBy = 'createdAt', orderBy = 'desc'} = filter;
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 10;

    const where: Prisma.WorkScheduleWhereInput = {};

    if (filter.shiftId) {
      where.shiftId = filter.shiftId;
    }
    if (filter.employeeId) {
      where.employeeId = filter.employeeId;
    }
    if (filter.centerId) {
      where.shift = { centerId: filter.centerId };
    }
    if (filter.dateFrom && filter.dateTo) {
      where.date = { gte: new Date(filter.dateFrom), lte: new Date(filter.dateTo) };
    }
    else if (filter.dateFrom) {
      where.date = { gte: new Date(filter.dateFrom) };
    }
    else if (filter.dateTo) {
      where.date = { lte: new Date(filter.dateTo) };
    }
    if (userRole === AccountRole.STAFF || userRole === AccountRole.TECHNICIAN) {
      if (!employeeId) {
        throw new BadRequestException('Employee ID is required for STAFF and TECHNICIAN roles');
      }
    }

    // STAFF & TECHNICIAN can only see their own schedule and their own center's schedule
    if ((userRole === AccountRole.STAFF || userRole === AccountRole.TECHNICIAN) && employeeId) {
      const assignedCenters = await this.prismaService.workCenter.findMany({
        where: { employeeId },
        select: { centerId: true }
      })
      const centerIds = assignedCenters.map(ac => ac.centerId);

      where.OR = [
        { employeeId },
        ...(centerIds.length > 0 ? [{ shift: { centerId: { in: centerIds } } }] : [])
      ];
    }

    const [workSchedules, total] = await this.prismaService.$transaction([
      this.prismaService.workSchedule.findMany({
        where,
        include: {
          employee: {
            include: { account: true }
          },
          shift: {
            include: { serviceCenter: true }
          },
        },
        orderBy: { [sortBy]: orderBy },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.workSchedule.count({ where })
    ]);
    return {
      data: workSchedules.map(ws => plainToInstance(WorkScheduleDto, ws)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  async getWorkScheduleById(id: string, userRole: AccountRole, employeeId?: string): Promise<WorkScheduleDto> {
    const workSchedule = await this.prismaService.workSchedule.findUnique({
      where: { id },
      include: {
        employee: {
          include: { account: true }
        },
        shift: {
          include: { serviceCenter: true }
        }
      }
    });
    if (!workSchedule) {
      throw new NotFoundException(`Work schedule with ID ${id} not found`);
    }

    // STAFF & TECHNICIAN can only see their own schedule and their own center's schedule
    if ((userRole === AccountRole.STAFF || userRole === AccountRole.TECHNICIAN) && employeeId) {
      const isOwnSchedule = workSchedule.employeeId === employeeId;

      if (!isOwnSchedule) {
        const isAssignedCenter = await this.prismaService.workCenter.findFirst({
          where: {
            employeeId,
            centerId: workSchedule.shift.centerId
          }
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
    userRole: AccountRole,
    employeeId?: string
  ): Promise<WorkScheduleDto[]> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update work schedule assignments');
    }

    const shift = await this.prismaService.shift.findUnique({
      where: { id: shiftId },
      include: { serviceCenter: true }
    });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${shiftId} not found`);
    }

    const targetDate = new Date(date);

    if (updateDto.employeeId) {
      // Validate new employees
      const employees = await this.prismaService.employee.findMany({
        where: {
          accountId: { in: updateDto.employeeId },
          account: {
            role: {
              in: [AccountRole.STAFF, AccountRole.TECHNICIAN]
            }
          }
        }
      });

      if (employees.length !== updateDto.employeeId.length) {
        throw new BadRequestException('Some employee IDs are invalid or not STAFF/TECHNICIAN');
      }

      if (shift.maximumSlot && updateDto.employeeId.length > shift.maximumSlot) {
        throw new ConflictException(`Shift capacity exceeded. Maximum: ${shift.maximumSlot}, Trying to assign: ${updateDto.employeeId.length}`);
      }

      await this.prismaService.$transaction([
        // Remove existing schedules for the shift on that date
        this.prismaService.workSchedule.deleteMany({
          where: {
            shiftId,
            date: targetDate
          }
        }),
        // Create new schedules
        ...updateDto.employeeId.map(empId =>
          this.prismaService.workSchedule.create({
            data: {
              employeeId: empId,
              shiftId,
              date: targetDate,
            }
          })
        )
      ]);
    }

    const updatedSchedules = await this.prismaService.workSchedule.findMany({
      where: {
        shiftId,
        date: targetDate
      },
      include: {
        employee: {
          include: { account: true }
        },
        shift: {
          include: { serviceCenter: true }
        }
      }
    });

    return updatedSchedules.map(ws => plainToInstance(WorkScheduleDto, ws));
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
        shift: {
          include: { serviceCenter: true }
        },
        employee: {
          include: { account: true }
        }
      }
    });

    if (!workSchedule) {
      throw new NotFoundException(`Work schedule with ID ${id} not found`);
    }

    await this.prismaService.workSchedule.delete({
      where: { id }
    });

    const employeeRole = workSchedule.employee.account?.role;
    return {
      message: `Removed ${employeeRole} ${workSchedule.employee.firstName} ${workSchedule.employee.lastName} from shift "${workSchedule.shift.name}" on ${workSchedule.date.toDateString()}`
    };
  }

  async getEmployeesInShift(
    shiftId: string,
    date: string,
    userRole: AccountRole,
    employeeId?: string
  ): Promise<WorkScheduleDto[]> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can view shift assignments');
    }

    const schedules = await this.prismaService.workSchedule.findMany({
      where: {
        shiftId,
        date: new Date(date)
      },
      include: {
        employee: {
          include: { account: true }
        },
        shift: {
          include: { serviceCenter: true }
        }
      },
      orderBy: {
        employee: { firstName: 'asc' }
      }
    });

    return schedules.map(ws => plainToInstance(WorkScheduleDto, ws));
  }
}
