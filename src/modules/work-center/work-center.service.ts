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
import { create } from 'domain';

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

    // Validate service center exists
    const serviceCenter = await this.prismaService.serviceCenter.findUnique({
      where: { id: createWorkCenterDto.centerId },
    });

    if (!serviceCenter) {
      throw new NotFoundException(
        `Service center with ID ${createWorkCenterDto.centerId} not found`
      );
    }

    // Validate employee exists and has correct role
    const employee = await this.prismaService.employee.findUnique({
      where: { accountId: createWorkCenterDto.employeeId },
      include: { account: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${createWorkCenterDto.employeeId} not found`);
    }

    if (
      employee.account?.role !== AccountRole.STAFF &&
      employee.account?.role !== AccountRole.TECHNICIAN
    ) {
      throw new BadRequestException(
        'Only STAFF and TECHNICIAN employees can be assigned to service centers'
      );
    }

    const startDate = new Date(createWorkCenterDto.startDate);
    const endDate = createWorkCenterDto.endDate ? new Date(createWorkCenterDto.endDate) : null;

    if (endDate && startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    await this.checkEmployeeOverlap(createWorkCenterDto.employeeId, startDate, endDate);
    // Check for overlapping assignments
    const overlapping = await this.prismaService.workCenter.findFirst({
      where: {
        employeeId: createWorkCenterDto.employeeId,
        OR: [
          {
            AND: [
              { startDate: { lte: endDate || new Date('2099-12-31') } },
              { endDate: endDate ? { gte: startDate } : null },
            ],
          },
          // ✅ Handle permanent assignments (endDate is null)
          {
            AND: [{ endDate: null }, { startDate: { lte: endDate || new Date('2099-12-31') } }],
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictException(
        `Employee ${employee.firstName} ${employee.lastName} already has an overlapping assignment at this center`
      );
    }

    const workCenter = await this.prismaService.workCenter.create({
      data: {
        employeeId: createWorkCenterDto.employeeId,
        centerId: createWorkCenterDto.centerId,
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

    const targetCenterId = updateWorkCenterDto.centerId || existingWorkCenter.centerId;
    const targetEmployeeId = updateWorkCenterDto.employeeId || existingWorkCenter.employeeId;

    const targetStartDate = updateWorkCenterDto.startDate
      ? new Date(updateWorkCenterDto.startDate)
      : existingWorkCenter.startDate;

    const targetEndDate =
      updateWorkCenterDto.endDate !== undefined
        ? updateWorkCenterDto.endDate
          ? new Date(updateWorkCenterDto.endDate)
          : null
        : existingWorkCenter.endDate;

    // Date validation
    if (targetEndDate && targetStartDate >= targetEndDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Validate new service center if changed
    if (
      updateWorkCenterDto.centerId &&
      updateWorkCenterDto.centerId !== existingWorkCenter.centerId
    ) {
      const serviceCenter = await this.prismaService.serviceCenter.findUnique({
        where: { id: updateWorkCenterDto.centerId },
      });

      if (!serviceCenter) {
        throw new NotFoundException(
          `Service center with ID ${updateWorkCenterDto.centerId} not found`
        );
      }
    }

    // Validate new employee if changed
    if (
      updateWorkCenterDto.employeeId &&
      updateWorkCenterDto.employeeId !== existingWorkCenter.employeeId
    ) {
      const employee = await this.prismaService.employee.findUnique({
        where: { accountId: updateWorkCenterDto.employeeId },
        include: { account: true },
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${updateWorkCenterDto.employeeId} not found`);
      }

      if (
        employee.account?.role !== AccountRole.STAFF &&
        employee.account?.role !== AccountRole.TECHNICIAN
      ) {
        throw new BadRequestException(
          `Only STAFF and TECHNICIAN employees can be assigned. Employee ${employee.firstName} ${employee.lastName} has role ${employee.account?.role}`
        );
      }

      // Check for overlapping assignments with new employee
      const overlapping = await this.prismaService.workCenter.findFirst({
        where: {
          employeeId: targetEmployeeId,
          centerId: targetCenterId,
          id: { not: id },
          OR: [
            {
              AND: [
                { startDate: { lte: targetEndDate || new Date('2099-12-31') } },
                { endDate: targetEndDate ? { gte: targetStartDate } : null },
              ],
            },
            {
              AND: [
                { endDate: null },
                { startDate: { lte: targetEndDate || new Date('2099-12-31') } },
              ],
            },
          ],
        },
      });

      if (overlapping) {
        throw new ConflictException(
          `Employee ${employee.firstName} ${employee.lastName} already has an overlapping assignment at this center`
        );
      }
    }

    if (
      updateWorkCenterDto.employeeId ||
      updateWorkCenterDto.startDate ||
      updateWorkCenterDto.endDate !== undefined ||
      updateWorkCenterDto.centerId
    ) {
      await this.checkEmployeeOverlap(
        targetEmployeeId,
        targetStartDate,
        targetEndDate,
        id // exclude current record
      );
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
