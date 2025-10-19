import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkCenterDTO } from './dto/create-work-center.dto';
import { UpdateWorkCenterDTO } from './dto/update-work-center.dto';
import { WorkCenterQueryDTO } from './dto/work-center-query.dto';
import { WorkCenterDTO } from './dto/work-center.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { plainToInstance } from 'class-transformer';
import { AccountRole, Prisma } from '@prisma/client';

@Injectable()
export class WorkCenterService {
  constructor(private readonly prismaService: PrismaService) {}

  private async checkEmployeeOverlap(
    employeeId: string,
    startDate: Date,
    endDate: Date | null,
    excludeId?: string
  ): Promise<void> {
    const overlapping = await this.prismaService.workCenter.findFirst({
      where: {
        employeeId,
        ...(excludeId && { id: { not: excludeId } }),
        OR: [
          {
            AND: [
              { startDate: { lte: endDate || new Date('2099-12-31') } },
              {
                OR: [
                  { endDate: null }, // Permanent assignment
                  { endDate: { gte: startDate } }, // Active assignment overlaps
                ],
              },
            ],
          },
        ],
      },
      include: {
        serviceCenter: { select: { name: true } },
        employee: {
          include: {
            account: {
              select: {
                employee: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
    });

    if (overlapping) {
      const employeeName = `${overlapping.employee.account?.employee?.firstName} ${overlapping.employee.account?.employee?.lastName}`;
      const centerName = overlapping.serviceCenter?.name || 'another center';

      throw new ConflictException(
        `Employee ${employeeName} already has an active assignment at ${centerName} from ${overlapping.startDate.toDateString()} to ${overlapping.endDate?.toDateString() || 'permanent'}`
      );
    }
  }

  async createWorkCenter(
    createWorkCenterDto: CreateWorkCenterDTO,
    role: AccountRole
  ): Promise<WorkCenterDTO> {
    if (role !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can assign employees to service centers');
    }

    const { employeeId, centerId, startDate, endDate } = createWorkCenterDto;
    const errors: Record<string, string> = {};

    // --- Employee tồn tại & role hợp lệ ---
    const employee = await this.prismaService.employee.findUnique({
      where: { accountId: employeeId },
      include: { account: true },
    });
    if (!employee) {
      errors.employeeId = `Employee with ID ${employeeId} not found`;
    } else if (
      employee.account.role !== AccountRole.TECHNICIAN &&
      employee.account.role !== AccountRole.STAFF
    ) {
      errors.employeeId = `Only STAFF and TECHNICIAN employees can be assigned. This employee has role ${employee.account?.role}`;
    }

    // --- Service center tồn tại ---
    const center = await this.prismaService.serviceCenter.findUnique({ where: { id: centerId } });
    if (!center) {
      errors.centerId = `Service center with ID ${centerId} not found`;
    }

    // --- Validate date range ---
    const startDateStr = new Date(createWorkCenterDto.startDate);
    const endDateStr = createWorkCenterDto.endDate ? new Date(createWorkCenterDto.endDate) : null;
    if (endDate && startDate >= endDate) {
      errors.dateRange = 'End date must be after start date';
    }

    // --- Check overlapping assignments ---
    if (employee && startDateStr && !errors.employeeId) {
      try {
        await this.checkEmployeeOverlap(employeeId, startDateStr, endDateStr);
      } catch (error) {
        if (error instanceof ConflictException) {
          errors.overlap = error.message;
        }
      }
    }

    // --- Throw all business validation errors ---
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }
    // Create work center
    const workCenter = await this.prismaService.workCenter.create({
      data: {
        employeeId,
        centerId,
        startDate,
        endDate,
      },
      include: {
        employee: {
          include: {
            account: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
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
        serviceCenter: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
          },
        },
      },
    });

    return plainToInstance(WorkCenterDTO, workCenter, {
      excludeExtraneousValues: true,
    });
  }

  async getWorkCenters(
    filter: WorkCenterQueryDTO,
    role: AccountRole,
    currentUserId?: string
  ): Promise<PaginationResponse<WorkCenterDTO>> {
    const { page = 1, pageSize = 10, sortBy = 'startDate', orderBy = 'desc' } = filter;

    const where: Prisma.WorkCenterWhereInput = {
      id: filter.id ? { contains: filter.id, mode: 'insensitive' } : undefined,
      employeeId: filter.employeeId
        ? { contains: filter.employeeId, mode: 'insensitive' }
        : undefined,
      centerId: filter.centerId ? { contains: filter.centerId, mode: 'insensitive' } : undefined,
    };

    // Date filters for startDate
    if (filter.startDate && filter.endDate) {
      where.startDate = {
        gte: new Date(filter.startDate),
        lte: new Date(filter.endDate),
      };
    } else if (filter.startDate) {
      where.startDate = { gte: new Date(filter.startDate) };
    } else if (filter.endDate) {
      where.startDate = { lte: new Date(filter.endDate) };
    }

    if ((role === AccountRole.STAFF || role === AccountRole.TECHNICIAN) && currentUserId) {
      where.employeeId = currentUserId;
    }

    // Order by
    const orderByClause: Prisma.WorkCenterOrderByWithRelationInput = {};
    if (sortBy === 'employee') {
      orderByClause.employee = { firstName: orderBy };
    } else if (sortBy === 'serviceCenter') {
      orderByClause.serviceCenter = { name: orderBy };
    } else {
      orderByClause[sortBy as keyof Prisma.WorkCenterOrderByWithRelationInput] = orderBy;
    }

    const [workCenters, total] = await this.prismaService.$transaction([
      this.prismaService.workCenter.findMany({
        where,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          employee: {
            include: {
              account: {
                select: {
                  id: true,
                  email: true,
                  phone: true,
                  role: true,
                  status: true,
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
          serviceCenter: {
            select: {
              id: true,
              name: true,
              address: true,
              status: true,
            },
          },
        },
        orderBy: orderByClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.workCenter.count({ where }),
    ]);

    return {
      data: workCenters.map(wc =>
        plainToInstance(WorkCenterDTO, wc, {
          excludeExtraneousValues: true,
        })
      ),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getWorkCenterById(
    id: string,
    role: AccountRole,
    currentUserId?: string
  ): Promise<WorkCenterDTO> {
    const workCenter = await this.prismaService.workCenter.findUnique({
      where: { id },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        employee: {
          include: {
            account: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
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
        serviceCenter: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
          },
        },
      },
    });

    if (!workCenter) {
      throw new NotFoundException(`Work center assignment with ID ${id} not found`);
    }

    if ((role === AccountRole.STAFF || role === AccountRole.TECHNICIAN) && currentUserId) {
      if (workCenter.employee.accountId !== currentUserId) {
        throw new ForbiddenException('You can only view your own work center assignments');
      }
    }

    return plainToInstance(WorkCenterDTO, workCenter, {
      excludeExtraneousValues: true,
    });
  }

  async updateWorkCenter(
    id: string,
    updateWorkCenterDto: UpdateWorkCenterDTO
  ): Promise<WorkCenterDTO> {
    const errors: Record<string, string> = {};
    const existingWorkCenter = await this.prismaService.workCenter.findUnique({
      where: { id },
      include: {
        employee: { include: { account: true } },
        serviceCenter: true,
      },
    });

    if (!existingWorkCenter) {
      throw new NotFoundException(`Work center assignment with ID ${id} not found`);
    }

    // --- Determine target values ---
    const targetEmployeeId = updateWorkCenterDto.employeeId ?? existingWorkCenter.employeeId;
    const targetCenterId = updateWorkCenterDto.centerId ?? existingWorkCenter.centerId;
    const targetStartDate = updateWorkCenterDto.startDate
      ? new Date(updateWorkCenterDto.startDate)
      : existingWorkCenter.startDate;
    const targetEndDate = updateWorkCenterDto.endDate
      ? new Date(updateWorkCenterDto.endDate)
      : existingWorkCenter.endDate;

    // --- Validate employeeId ---
    if (!targetEmployeeId || targetEmployeeId.trim() === '') {
      errors.employeeId = 'Employee ID cannot be empty';
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(targetEmployeeId)) {
        errors.employeeId = 'Employee ID must be a valid UUID';
      } else {
        const employee = await this.prismaService.employee.findUnique({
          where: { accountId: targetEmployeeId },
          include: { account: true },
        });
        if (!employee) {
          errors.employeeId = `Employee with ID ${targetEmployeeId} not found`;
        } else if (
          employee.account.role !== AccountRole.STAFF &&
          employee.account.role !== AccountRole.TECHNICIAN
        ) {
          errors.employeeId = `Only STAFF and TECHNICIAN employees can be assigned. Employee has role ${employee.account.role}`;
        }
      }
    }

    // --- Validate centerId ---
    if (!targetCenterId || targetCenterId.trim() === '') {
      errors.centerId = 'Center ID cannot be empty';
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(targetCenterId)) {
        errors.centerId = 'Center ID must be a valid UUID';
      } else {
        const center = await this.prismaService.serviceCenter.findUnique({
          where: { id: targetCenterId },
        });
        if (!center) {
          errors.centerId = `Service center with ID ${targetCenterId} not found`;
        }
      }
    }

    // --- Validate date ---
    if (
      updateWorkCenterDto.startDate !== undefined &&
      updateWorkCenterDto.startDate.trim() === ''
    ) {
      errors.startDate = 'Start date cannot be empty';
    }
    if (targetEndDate && targetStartDate && targetStartDate >= targetEndDate) {
      errors.dateRange = 'End date must be after start date';
    }

    // --- Check overlapping assignments ---
    try {
      await this.checkEmployeeOverlap(targetEmployeeId, targetStartDate, targetEndDate, id);
    } catch (error) {
      if (error instanceof ConflictException) {
        errors.overlap = error.message;
      }
    }

    // --- Throw all validation errors at once ---
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    const updatedWorkCenter = await this.prismaService.workCenter.update({
      where: { id },
      data: {
        employeeId: targetEmployeeId,
        centerId: targetCenterId,
        startDate: targetStartDate,
        endDate: targetEndDate,
      },
      include: {
        employee: {
          include: {
            account: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
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
        serviceCenter: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
          },
        },
      },
    });

    return plainToInstance(WorkCenterDTO, updatedWorkCenter, {
      excludeExtraneousValues: true,
    });
  }

  async deleteWorkCenter(id: string): Promise<void> {
    const workCenter = await this.prismaService.workCenter.findUnique({
      where: { id },
      include: {
        employee: { include: { account: true } },
        serviceCenter: true,
      },
    });

    if (!workCenter) {
      throw new NotFoundException(`Work center assignment with ID ${id} not found`);
    }

    if (workCenter.endDate && workCenter.endDate < new Date()) {
      throw new BadRequestException('This assignment has already ended');
    }

    // Soft delete: set endDate to current date
    await this.prismaService.workCenter.update({
      where: { id },
      data: { endDate: new Date() },
    });
  }
}
