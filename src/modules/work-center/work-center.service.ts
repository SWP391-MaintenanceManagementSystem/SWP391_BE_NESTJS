import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkCenterDto } from './dto/create-work-center.dto';
import { UpdateWorkCenterDto } from './dto/update-work-center.dto';
import { WorkCenterQueryDto } from './dto/work-center-query.dto';
import { WorkCenterDto } from './dto/work-center.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { plainToInstance } from 'class-transformer';
import { AccountRole, Prisma } from '@prisma/client';

@Injectable()
export class WorkCenterService {
  constructor(private readonly prismaService: PrismaService) {}
  async createWorkCenter(
    createWorkCenterDto: CreateWorkCenterDto,
    userRole: AccountRole,
  ): Promise<WorkCenterDto[]> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can assign employees to service centers');
    }

    const serviceCenter = await this.prismaService.serviceCenter.findUnique({
      where: { id: createWorkCenterDto.centerId },
    });

    if (!serviceCenter) {
      throw new NotFoundException(`Service center with ID ${createWorkCenterDto.centerId} not found`);
    }

    const startDate = createWorkCenterDto.startDate ? new Date(createWorkCenterDto.startDate) : new Date();
    const endDate = createWorkCenterDto.endDate ? new Date(createWorkCenterDto.endDate) : null;

    const createdAssignments = [];

  for (const empId of createWorkCenterDto.employeeId) {
    const employee = await this.prismaService.employee.findUnique({
      where: { accountId: empId },
      include: { account: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${empId} not found`);
    }

    if (employee.account?.role !== AccountRole.STAFF && employee.account?.role !== AccountRole.TECHNICIAN) {
      throw new BadRequestException('Only STAFF and TECHNICIAN employees can be assigned to service centers');
    }

    // Check overlapping assignments
    const overlapping = await this.prismaService.workCenter.findFirst({
      where: {
        employeeId: empId,
        centerId: createWorkCenterDto.centerId,
        OR: [
          {
            startDate: { lte: endDate || new Date('2099-12-31') },
            endDate: { gte: startDate },
          },
          { endDate: null },
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
        employeeId: empId,
        centerId: createWorkCenterDto.centerId,
        startDate,
        endDate,
      },
      include: {
        employee: { include: { account: true } },
        serviceCenter: true,
      },
    });

    createdAssignments.push(workCenter);
  }

    return createdAssignments.map(wc => plainToInstance(WorkCenterDto, wc));
  }

  async getWorkCenters(
    filter: WorkCenterQueryDto,
    userRole: AccountRole,
    currentUserId?: string
  ): Promise<PaginationResponse<WorkCenterDto>> {
    const { page = 1, pageSize = 10, sortBy = 'startDate', orderBy = 'desc' } = filter;

    const where: Prisma.WorkCenterWhereInput = {};

    // Apply filters
    if (filter.employeeId) {
      where.employeeId = filter.employeeId;
    }
    if (filter.centerId) {
      where.centerId = filter.centerId;
    }

    // Date filters for startDate
    if (filter.dateFrom && filter.dateTo) {
      where.startDate = {
        gte: new Date(filter.dateFrom),
        lte: new Date(filter.dateTo),
      };
    } else if (filter.dateFrom) {
      where.startDate = { gte: new Date(filter.dateFrom) };
    } else if (filter.dateTo) {
      where.startDate = { lte: new Date(filter.dateTo) };
    }

    if ((userRole === AccountRole.STAFF || userRole === AccountRole.TECHNICIAN) && currentUserId) {
      // Both STAFF and TECHNICIAN can only see their own assignments
      where.employeeId = currentUserId;
    }
    // ADMIN can see all assignments

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
        include: {
          employee: {
            include: { account: true },
          },
          serviceCenter: true,
        },
        orderBy: orderByClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.workCenter.count({ where }),
    ]);

    return {
      data: workCenters.map(wc => plainToInstance(WorkCenterDto, wc)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getWorkCenterById(
  id: string,
  userRole: AccountRole,
  currentUserId?: string
): Promise<WorkCenterDto> {
  const workCenter = await this.prismaService.workCenter.findUnique({
    where: { id },
    include: {
      employee: {
        include: { account: true },
      },
      serviceCenter: true,
    },
  });

  if (!workCenter) {
    throw new NotFoundException(`Work center assignment with ID ${id} not found`);
  }

  // ✅ Role-based access control
  if ((userRole === AccountRole.STAFF || userRole === AccountRole.TECHNICIAN) && currentUserId) {
    if (workCenter.employeeId !== currentUserId) {
      throw new ForbiddenException('You can only view your own work center assignments');
    }
  }

  return plainToInstance(WorkCenterDto, workCenter);
}

  async updateWorkCenter(
    id: string,
    updateWorkCenterDto: UpdateWorkCenterDto,
    userRole: AccountRole,
    currentUserId?: string
    ): Promise<WorkCenterDto[]> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update work center assignments');
    }
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
    const targetStartDate = updateWorkCenterDto.startDate ? new Date(updateWorkCenterDto.startDate) : existingWorkCenter.startDate;
    const targetEndDate = updateWorkCenterDto.endDate !== undefined
      ? (updateWorkCenterDto.endDate ? new Date(updateWorkCenterDto.endDate) : null)
      : existingWorkCenter.endDate;

    // Date validation
    if (targetEndDate && targetStartDate >= targetEndDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (updateWorkCenterDto.employeeId && updateWorkCenterDto.employeeId.length > 0) {
      // Validate new service center if changed
      if (updateWorkCenterDto.centerId && updateWorkCenterDto.centerId !== existingWorkCenter.centerId) {
        const serviceCenter = await this.prismaService.serviceCenter.findUnique({
          where: { id: updateWorkCenterDto.centerId },
        });

        if (!serviceCenter) {
          throw new NotFoundException(`Service center with ID ${updateWorkCenterDto.centerId} not found`);
        }
      }

      const employees = await this.prismaService.employee.findMany({
        where: {
          accountId: { in: updateWorkCenterDto.employeeId },
        },
        include: { account: true },
      });

      if (employees.length !== updateWorkCenterDto.employeeId.length) {
        throw new NotFoundException('Some employee IDs not found');
      }

      for (const employee of employees) {
        if (employee.account?.role !== AccountRole.STAFF && employee.account?.role !== AccountRole.TECHNICIAN) {
          throw new BadRequestException(`Only STAFF and TECHNICIAN employees can be assigned. Employee ${employee.firstName} ${employee.lastName} has role ${employee.account?.role}`);
        }
      }

      const currentAssignments = await this.prismaService.workCenter.findMany({
        where: {
          centerId: existingWorkCenter.centerId,
          startDate: existingWorkCenter.startDate,
          endDate: existingWorkCenter.endDate,
        },
      });

      const currentEmployeeIds = currentAssignments.map(a => a.employeeId);
      const newEmployeeIds = updateWorkCenterDto.employeeId;

      // Calculate changes
      const toKeep = newEmployeeIds.filter(id => currentEmployeeIds.includes(id));
      const toAdd = newEmployeeIds.filter(id => !currentEmployeeIds.includes(id));
      const toRemove = currentEmployeeIds.filter(id => !newEmployeeIds.includes(id));

      // Check for overlapping assignments for new employees
      if (toAdd.length > 0) {
        for (const empId of toAdd) {
          const overlappingConditions = [
            {
              startDate: { lte: targetEndDate || new Date('2099-12-31') },
              endDate: { gte: targetStartDate }
            }
          ];

          if (!targetEndDate) {
            overlappingConditions.push({ endDate: null });
          }

          const overlapping = await this.prismaService.workCenter.findFirst({
            where: {
              employeeId: empId,
              centerId: targetCenterId,
              OR: overlappingConditions,
            },
          });

          if (overlapping) {
            const employee = employees.find(e => e.accountId === empId);
            throw new ConflictException(
              `Employee ${employee?.firstName} ${employee?.lastName} already has an overlapping assignment at this center`
            );
          }
        }
      }
      await this.prismaService.$transaction(async (prisma) => {
        if (toRemove.length > 0) {
          await prisma.workCenter.deleteMany({
            where: {
              centerId: existingWorkCenter.centerId,
              startDate: existingWorkCenter.startDate,
              endDate: existingWorkCenter.endDate,
              employeeId: { in: toRemove },
            },
          });
        }

        // Add new employees
        if (toAdd.length > 0) {
          await prisma.workCenter.createMany({
            data: toAdd.map(empId => ({
              employeeId: empId,
              centerId: targetCenterId,
              startDate: targetStartDate,
              endDate: targetEndDate,
            })),
          });
        }

        // Update existing assignments if center or dates changed
        if (toKeep.length > 0 && (updateWorkCenterDto.centerId || updateWorkCenterDto.startDate || updateWorkCenterDto.endDate !== undefined)) {
          await prisma.workCenter.updateMany({
            where: {
              centerId: existingWorkCenter.centerId,
              startDate: existingWorkCenter.startDate,
              endDate: existingWorkCenter.endDate,
              employeeId: { in: toKeep },
            },
            data: {
              ...(updateWorkCenterDto.centerId && { centerId: updateWorkCenterDto.centerId }),
              ...(updateWorkCenterDto.startDate && { startDate: targetStartDate }),
              ...(updateWorkCenterDto.endDate !== undefined && { endDate: targetEndDate }),
            },
          });
        }
      });

      const updatedAssignments = await this.prismaService.workCenter.findMany({
        where: {
          centerId: targetCenterId,
          employeeId: { in: newEmployeeIds },
          startDate: targetStartDate,
          endDate: targetEndDate,
        },
        include: {
          employee: { include: { account: true } },
          serviceCenter: true,
        },
        orderBy: { employee: { firstName: 'asc' } },
      });

      return updatedAssignments.map(wc => plainToInstance(WorkCenterDto, wc));
    }
    else {
      const updateData: any = {};
      if (updateWorkCenterDto.centerId) updateData.centerId = updateWorkCenterDto.centerId;
      if (updateWorkCenterDto.startDate) updateData.startDate = targetStartDate;
      if (updateWorkCenterDto.endDate !== undefined) updateData.endDate = targetEndDate;

      const updatedWorkCenter = await this.prismaService.workCenter.update({
        where: { id },
        data: updateData,
        include: {
          employee: { include: { account: true } },
          serviceCenter: true,
        },
      });

      return [plainToInstance(WorkCenterDto, updatedWorkCenter)];
    }
  }

  async deleteWorkCenter(
    id: string,
    userRole: AccountRole,
    currentUserId?: string
  ): Promise<{ message: string }> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can remove work center assignments');
    }

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

    if (workCenter.endDate) {
      throw new BadRequestException('This assignment has already ended');
    }

    // Set endDate to now instead of deleting the record
    await this.prismaService.workCenter.update({
      where: { id },
      data: {
        endDate: new Date(),
      },
    });

    const employeeRole = workCenter.employee.account?.role;
    return {
      message: `Ended assignment for ${employeeRole} ${workCenter.employee.firstName} ${workCenter.employee.lastName} at service center "${workCenter.serviceCenter.name}"`,
    };
  }
}
