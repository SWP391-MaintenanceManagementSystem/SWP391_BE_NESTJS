import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Prisma, AccountRole } from '@prisma/client';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { EmployeeQueryDTO } from './dto/employee-query.dto';
import { EmployeeWithCenterDTO } from './dto/employee-with-center.dto';
import { plainToInstance } from 'class-transformer';

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
}
