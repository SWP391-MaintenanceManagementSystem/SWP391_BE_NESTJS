import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Prisma, AccountRole } from '@prisma/client';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { EmployeeQueryDTO } from './dto/employee-query.dto';
import { EmployeeWithCenterDTO } from './dto/employee-with-center.dto';
import { plainToInstance } from 'class-transformer';
import { UpdateEmployeeWithCenterDTO } from './dto/update-employee-with-center.dto';
import { UpdateTechnicianDTO } from './technician/dto/update-technician.dto';
import { UpdateStaffDTO } from './staff/dto/update-staff.dto';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployees(
    filter: EmployeeQueryDTO,
    role: AccountRole
  ): Promise<PaginationResponse<EmployeeWithCenterDTO>> {
    let { page = 1, pageSize = 10, orderBy = 'asc', sortBy = 'createdAt' } = filter;
    page = Math.max(page, 1);
    pageSize = Math.max(pageSize, 1);

    const where: Prisma.AccountWhereInput = { role };

    // Account level filters
    if (filter.email) where.email = { contains: filter.email, mode: 'insensitive' };
    if (filter.phone) where.phone = { contains: filter.phone, mode: 'insensitive' };
    if (filter.status) where.status = filter.status;

    // Employee level filters
    const employeeWhere: Prisma.EmployeeWhereInput = {};
    const employeeConditions: any[] = [];

    if (filter.employeeId) employeeWhere.accountId = filter.employeeId;
    if (filter.firstName)
      employeeWhere.firstName = { contains: filter.firstName, mode: 'insensitive' };
    if (filter.lastName)
      employeeWhere.lastName = { contains: filter.lastName, mode: 'insensitive' };

    // WorkCenter assignment status filter
    if (filter.hasWorkCenter !== undefined) {
      if (filter.hasWorkCenter) {
        // Filter for employees WITH work center
        employeeConditions.push({
          workCenters: {
            some: {
              OR: [
                { endDate: null }, // Permanent assignment
                { endDate: { gt: new Date() } }, // Active assignment
              ],
            },
          },
        });
      } else {
        // Filter for employees WITHOUT work center (Not assigned)
        employeeConditions.push({
          workCenters: { none: {} },
        });
      }
    }

    // Specific service center filters
    if (filter.centerId || filter.name) {
      const workCenterConditions: Prisma.WorkCenterWhereInput = {};
      if (filter.centerId) workCenterConditions.centerId = filter.centerId;
      if (filter.name)
        workCenterConditions.serviceCenter = {
          name: { contains: filter.name, mode: 'insensitive' },
        };

      // Only active assignments
      workCenterConditions.OR = [{ endDate: null }, { endDate: { gt: new Date() } }];

      // If hasWorkCenter is false, ignore center filters (they conflict)
      if (filter.hasWorkCenter !== false) {
        employeeConditions.push({
          workCenters: { some: workCenterConditions },
        });
      }
    }

    // Combine all employee conditions with AND
    if (employeeConditions.length > 0) {
      employeeWhere.AND = employeeConditions;
    }

    where.employee = employeeWhere;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.account.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          avatar: true,
          avatarPublicId: true,
          providerId: true,
          createdAt: true,
          updatedAt: true,
          employee: {
            select: {
              firstName: true,
              lastName: true,
              createdAt: true,
              updatedAt: true,
              certificates: {
                select: {
                  name: true,
                  issuedAt: true,
                  expiresAt: true,
                },
              },
              workCenters: {
                where: {
                  OR: [
                    { endDate: null }, // Permanent assignment
                    { endDate: { gte: new Date() } }, // Active assignment
                  ],
                },
                select: {
                  id: true,
                  startDate: true,
                  endDate: true,
                  serviceCenter: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                      status: true,
                    },
                  },
                },
                orderBy: {
                  startDate: 'desc', // Most recent assignment first
                },
                take: 1, // Take 1 to get the current active assignment
              },
            },
          },
        },
        orderBy: { [sortBy]: orderBy },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.account.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    const transformedData = data.map(emp => ({
      id: emp.id,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      status: emp.status,
      avatar: emp.avatar,
      avatarPublicId: emp.avatarPublicId,
      providerId: emp.providerId,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
      profile: emp.employee
        ? {
            firstName: emp.employee.firstName,
            lastName: emp.employee.lastName,
            createdAt: emp.employee.createdAt,
            updatedAt: emp.employee.updatedAt,
            certificates:
              emp.employee?.certificates?.map(c => ({
                name: c.name,
                issuedAt: c.issuedAt,
                expiresAt: c.expiresAt,
              })) ?? [],
          }
        : null,
      workCenter: emp.employee?.workCenters?.[0]?.serviceCenter
        ? {
            id: emp.employee.workCenters[0].serviceCenter.id,
            name: emp.employee.workCenters[0].serviceCenter.name,
          }
        : {
            id: null,
            name: 'Not assigned',
          },
    }));

    return {
      data: plainToInstance(EmployeeWithCenterDTO, transformedData, {
        excludeExtraneousValues: true,
      }),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async updateEmployeeWithWorkCenter(
    employeeId: string,
    workCenterData: UpdateEmployeeWithCenterDTO
  ) {
    const { centerId, startDate, endDate } = workCenterData;

    const employee = await this.prisma.employee.findUnique({
      where: { accountId: employeeId },
      include: {
        workCenters: {
          where: {
            OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
          },
          include: { serviceCenter: true },
        },
      },
    });

    if (!employee) throw new Error('Employee not found');

    const currentAssignment = employee.workCenters[0]; // Active assignment (nếu có)

    if (!centerId) {
      if (!currentAssignment) {
        return {
          employeeId,
          workCenter: { id: null, name: 'Not assigned' },
        };
      }

      await this.prisma.workCenter.update({
        where: { id: currentAssignment.id },
        data: { endDate: new Date() },
      });

      return {
        employeeId,
        workCenter: { id: null, name: 'Not assigned' },
      };
    }

    const serviceCenter = await this.prisma.serviceCenter.findUnique({
      where: { id: centerId },
    });
    if (!serviceCenter) throw new Error('Service center not found');

    const hasChanges =
      !currentAssignment ||
      currentAssignment.centerId !== centerId ||
      (startDate &&
        new Date(currentAssignment.startDate).toISOString().split('T')[0] !==
          new Date(startDate).toISOString().split('T')[0]) ||
      (endDate || null) !==
        (currentAssignment.endDate ? currentAssignment.endDate.toISOString().split('T')[0] : null);

    if (!hasChanges) {
      return {
        employeeId,
        workCenter: {
          id: currentAssignment?.serviceCenter?.id ?? null,
          name: currentAssignment?.serviceCenter?.name ?? 'Not assigned',
          address: currentAssignment?.serviceCenter?.address ?? null,
          status: currentAssignment?.serviceCenter?.status ?? null,
        },
      };
    }

    if (currentAssignment && currentAssignment.centerId !== centerId) {
      await this.prisma.workCenter.update({
        where: { id: currentAssignment.id },
        data: { endDate: new Date() },
      });
    }

    const newAssignment = await this.prisma.workCenter.create({
      data: {
        employeeId,
        centerId,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
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

    return {
      employeeId,
      workCenter: newAssignment.serviceCenter,
    };
  }

  async updateEmployee(
    employeeId: string,
    updateData: UpdateTechnicianDTO | UpdateStaffDTO
  ): Promise<EmployeeWithCenterDTO> {
    const { firstName, lastName, phone, status, workCenter } = updateData;

    const existing = await this.prisma.account.findUnique({
      where: { id: employeeId },
      include: { employee: true },
    });

    if (!existing?.employee) throw new Error('Employee not found');

    // Update account if changed
    const accountData: Record<string, any> = {};
    if (phone !== undefined) accountData.phone = phone;
    if (status !== undefined) accountData.status = status;
    if (Object.keys(accountData).length)
      await this.prisma.account.update({ where: { id: employeeId }, data: accountData });

    // Update employee if changed
    const employeeData: Record<string, any> = {};
    if (firstName !== undefined) employeeData.firstName = firstName;
    if (lastName !== undefined) employeeData.lastName = lastName;
    if (Object.keys(employeeData).length)
      await this.prisma.employee.update({ where: { accountId: employeeId }, data: employeeData });

    // Update work center assignment if provided
    if (workCenter) await this.updateEmployeeWithWorkCenter(employeeId, workCenter);

    // Fetch latest data
    const updated = await this.prisma.account.findUnique({
      where: { id: employeeId },
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
            certificates: {
              select: { name: true, issuedAt: true, expiresAt: true },
            },
            workCenters: {
              where: {
                OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
              },
              select: {
                startDate: true,
                endDate: true,
                serviceCenter: {
                  select: { id: true, name: true, address: true, status: true },
                },
              },
              orderBy: { startDate: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!updated?.employee) throw new Error('Failed to retrieve updated employee data');

    const transformed = {
      id: updated.id,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      status: updated.status,
      avatar: updated.avatar,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      profile: {
        firstName: updated.employee.firstName,
        lastName: updated.employee.lastName,
        createdAt: updated.employee.createdAt,
        updatedAt: updated.employee.updatedAt,
        certificates: updated.employee.certificates.map(c => ({
          name: c.name,
          issuedAt: c.issuedAt,
          expiresAt: c.expiresAt,
        })),
      },
      workCenter: updated.employee.workCenters[0]?.serviceCenter
        ? {
            id: updated.employee.workCenters[0].serviceCenter.id,
            name: updated.employee.workCenters[0].serviceCenter.name,
            address: updated.employee.workCenters[0].serviceCenter.address,
            status: updated.employee.workCenters[0].serviceCenter.status,
          }
        : { id: null, name: 'Not assigned' },
    };

    return plainToInstance(EmployeeWithCenterDTO, transformed, {
      excludeExtraneousValues: true,
    });
  }
}
