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
  ): Promise<WorkCenterDto> {
    if (userRole !== AccountRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can assign employees to service centers');
    }

    const serviceCenter = await this.prismaService.serviceCenter.findUnique({
      where: { id: createWorkCenterDto.centerId },
    });

    if (!serviceCenter) {
      throw new NotFoundException(`Service center with ID ${createWorkCenterDto.centerId} not found`);
    }

    const employee = await this.prismaService.employee.findUnique({
      where: { accountId: createWorkCenterDto.employeeId },
      include: { account: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${createWorkCenterDto.employeeId} not found`);
    }

    if (employee.account?.role !== AccountRole.STAFF && employee.account?.role !== AccountRole.TECHNICIAN) {
      throw new BadRequestException('Only STAFF and TECHNICIAN employees can be assigned to service centers');
    }

    const existingAssignment = await this.prismaService.workCenter.findFirst({
      where: {
        employeeId: createWorkCenterDto.employeeId,
        centerId: createWorkCenterDto.centerId,
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        `Employee ${employee.firstName} ${employee.lastName} is already assigned to service center ${serviceCenter.name}`
      );
    }

    const workCenter = await this.prismaService.workCenter.create({
      data: {
        employeeId: createWorkCenterDto.employeeId,
        centerId: createWorkCenterDto.centerId,
        assignedAt: createWorkCenterDto.assignedAt
          ? new Date(createWorkCenterDto.assignedAt)
          : new Date(),
        endDate: null,
      },
      include: {
        employee: {
          include: { account: true },
        },
        serviceCenter: true,
      },
    });

    return plainToInstance(WorkCenterDto, workCenter);
  }

  async getWorkCenters(
    filter: WorkCenterQueryDto,
    userRole: AccountRole,
    currentUserId?: string
  ): Promise<PaginationResponse<WorkCenterDto>> {
    const { page = 1, pageSize = 10, sortBy = 'assignedAt', orderBy = 'desc' } = filter;

    const where: Prisma.WorkCenterWhereInput = {};

    // Apply filters
    if (filter.employeeId) {
      where.employeeId = filter.employeeId;
    }
    if (filter.centerId) {
      where.centerId = filter.centerId;
    }

    // Date filters
    if (filter.dateFrom && filter.dateTo) {
      where.assignedAt = {
        gte: new Date(filter.dateFrom),
        lte: new Date(filter.dateTo),
      };
    } else if (filter.dateFrom) {
      where.assignedAt = { gte: new Date(filter.dateFrom) };
    } else if (filter.dateTo) {
      where.assignedAt = { lte: new Date(filter.dateTo) };
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
  ): Promise<WorkCenterDto> {
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

    //Fix: Validate new employee if provided (allow STAFF và TECHNICIAN)
    if (updateWorkCenterDto.employeeId && updateWorkCenterDto.employeeId !== existingWorkCenter.employeeId) {
      const employee = await this.prismaService.employee.findUnique({
        where: { accountId: updateWorkCenterDto.employeeId },
        include: { account: true },
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${updateWorkCenterDto.employeeId} not found`);
      }

      //Fix: Allow both STAFF and TECHNICIAN
      if (employee.account?.role !== AccountRole.STAFF && employee.account?.role !== AccountRole.TECHNICIAN) {
        throw new BadRequestException('Only STAFF and TECHNICIAN employees can be assigned to service centers');
      }
    }

    // Validate new service center if provided
    if (updateWorkCenterDto.centerId && updateWorkCenterDto.centerId !== existingWorkCenter.centerId) {
      const serviceCenter = await this.prismaService.serviceCenter.findUnique({
        where: { id: updateWorkCenterDto.centerId },
      });

      if (!serviceCenter) {
        throw new NotFoundException(`Service center with ID ${updateWorkCenterDto.centerId} not found`);
      }
    }

    // Check for duplicate assignment if employee or center changes
    if (updateWorkCenterDto.employeeId || updateWorkCenterDto.centerId) {
      const newEmployeeId = updateWorkCenterDto.employeeId || existingWorkCenter.employeeId;
      const newCenterId = updateWorkCenterDto.centerId || existingWorkCenter.centerId;

      const duplicateAssignment = await this.prismaService.workCenter.findFirst({
        where: {
          employeeId: newEmployeeId,
          centerId: newCenterId,
          id: { not: id },
        },
      });

      if (duplicateAssignment) {
        throw new ConflictException('This employee is already assigned to this service center');
      }
    }

    // Update work center assignment
    const updatedWorkCenter = await this.prismaService.workCenter.update({
      where: { id },
      data: {
        ...(updateWorkCenterDto.employeeId && { employeeId: updateWorkCenterDto.employeeId }),
        ...(updateWorkCenterDto.centerId && { centerId: updateWorkCenterDto.centerId }),
        ...(updateWorkCenterDto.assignedAt && { assignedAt: new Date(updateWorkCenterDto.assignedAt) }),
      },
      include: {
        employee: {
          include: { account: true },
        },
        serviceCenter: true,
      },
    });

    return plainToInstance(WorkCenterDto, updatedWorkCenter);
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

    await this.prismaService.workCenter.update({
      where: { id },
      data: {
        endDate: new Date(),
      },
    });

    const employeeRole = workCenter.employee.account?.role;
    return {
      message: `Removed ${employeeRole} ${workCenter.employee.firstName} ${workCenter.employee.lastName} from service center "${workCenter.serviceCenter.name}"`,
    };
  }

  //BONUS: Get employees assigned to a specific center (STAFF và TECHNICIAN)
  async getEmployeesByCenter(
    centerId: string,
    userRole: AccountRole,
    currentUserId?: string
  ): Promise<WorkCenterDto[]> {
    const serviceCenter = await this.prismaService.serviceCenter.findUnique({
      where: { id: centerId },
    });

    if (!serviceCenter) {
      throw new NotFoundException(`Service center with ID ${centerId} not found`);
    }

    //Fix: Role-based access for both STAFF and TECHNICIAN
    if ((userRole === AccountRole.STAFF || userRole === AccountRole.TECHNICIAN) && currentUserId) {
      const isAssigned = await this.prismaService.workCenter.findFirst({
        where: {
          employeeId: currentUserId,
          centerId,
        },
      });

      if (!isAssigned) {
        throw new ForbiddenException('You can only view employees in centers you are assigned to');
      }
    }

    const workCenters = await this.prismaService.workCenter.findMany({
      where: { centerId },
      include: {
        employee: {
          include: { account: true },
        },
        serviceCenter: true,
      },
      orderBy: {
        employee: { firstName: 'asc' },
      },
    });

    return workCenters.map(wc => plainToInstance(WorkCenterDto, wc));
  }

  //BONUS: Get centers assigned to a specific employee (STAFF và TECHNICIAN)
  async getCentersByEmployee(
    employeeId: string,
    userRole: AccountRole,
    currentUserId?: string
  ): Promise<WorkCenterDto[]> {
    //Fix: Role-based access for both STAFF and TECHNICIAN
    if ((userRole === AccountRole.STAFF || userRole === AccountRole.TECHNICIAN) && currentUserId) {
      if (employeeId !== currentUserId) {
        throw new ForbiddenException('You can only view your own center assignments');
      }
    }

    const employee = await this.prismaService.employee.findUnique({
      where: { accountId: employeeId },
      include: { account: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const workCenters = await this.prismaService.workCenter.findMany({
      where: { employeeId },
      include: {
        employee: {
          include: { account: true },
        },
        serviceCenter: true,
      },
      orderBy: {
        serviceCenter: { name: 'asc' },
      },
    });

    return workCenters.map(wc => plainToInstance(WorkCenterDto, wc));
  }
}
