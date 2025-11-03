import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Prisma, AccountRole, CenterStatus } from '@prisma/client';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { EmployeeQueryDTO, EmployeeQueryWithPaginationDTO } from './dto/employee-query.dto';
import { EmployeeWithCenterDTO } from './dto/employee-with-center.dto';
import { plainToInstance } from 'class-transformer';
import { UpdateEmployeeWithCenterDTO } from './dto/update-employee-with-center.dto';
import { UpdateTechnicianDTO } from './technician/dto/update-technician.dto';
import { UpdateStaffDTO } from './staff/dto/update-staff.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common/exceptions';
import { AccountStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { hashPassword, parseDate, vnToUtcDate, utcToVNDate, timeStringToDate } from 'src/utils';
import { isSameDay } from 'date-fns';
import { CreateTechnicianDTO } from './technician/dto/create-technician.dto';
import { CreateStaffDTO } from './staff/dto/create-staff.dto';
import { ConflictException } from '@nestjs/common/exceptions/conflict.exception';
import { start } from 'repl';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async getEmployees(
    filter: EmployeeQueryWithPaginationDTO,
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
            startDate: emp.employee.workCenters[0].startDate,
            endDate: emp.employee.workCenters[0].endDate,
          }
        : {
            id: null,
            name: 'Not assigned',
            startDate: null,
            endDate: null,
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

  private validateWorkCenter(
    workCenter: UpdateEmployeeWithCenterDTO,
    errors: Record<string, string>
  ): void {
    const { centerId, startDate, endDate } = workCenter;

    // Validate centerId
    if (centerId !== undefined && centerId.trim() !== '') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(centerId)) {
        errors['workCenter.centerId'] = 'Service Center ID must be a valid UUID';
      }
    }

    // Validate startDate
    if (startDate !== undefined && startDate.trim() !== '') {
      const parsed = parseDate(startDate);
      if (!parsed) {
        errors['workCenter.startDate'] = 'Start date must be a valid date (YYYY-MM-DD)';
      }
    }

    // Validate endDate
    if (endDate !== undefined && endDate.trim() !== '') {
      const parsed = parseDate(endDate);
      if (!parsed) {
        errors['workCenter.endDate'] = 'End date must be a valid date (YYYY-MM-DD)';
      }
    }

    // Validate date range
    if (startDate && startDate.trim() !== '' && endDate && endDate.trim() !== '') {
      const parsedStart = parseDate(startDate);
      const parsedEnd = parseDate(endDate);

      if (parsedStart && parsedEnd && parsedStart >= parsedEnd) {
        errors['workCenter.dateRange'] = 'Start date must be before end date';
      }
    }
  }

  async checkTechnicianHasAssigned(accountId: string): Promise<boolean> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { role: true },
    });

    if (!account) {
      throw new NotFoundException('Employee not found');
    }

    if (account.role !== AccountRole.TECHNICIAN) {
      return false;
    }

    const activeCount = await this.prisma.bookingAssignment.count({
      where: {
        employeeId: accountId,
        booking: {
          status: { in: ['ASSIGNED', 'IN_PROGRESS', 'CHECKED_IN', 'CHECKED_OUT'] },
        },
      },
    });

    return activeCount > 0;
  }

  async getTechnicianActiveBookings(employeeId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: employeeId },
      select: { role: true },
    });

    if (!account || account.role !== AccountRole.TECHNICIAN) {
      return [];
    }

    const activeAssignments = await this.prisma.bookingAssignment.findMany({
      where: {
        employeeId,
        booking: {
          status: {
            in: ['ASSIGNED', 'CHECKED_IN', 'IN_PROGRESS', 'CHECKED_OUT'],
          },
        },
      },
      select: {
        id: true,
        booking: {
          select: {
            id: true,
            status: true,
            bookingDate: true,
            customer: {
              select: { account: { select: { email: true } } },
            },
          },
        },
      },
      orderBy: {
        booking: {
          bookingDate: 'asc',
        },
      },
    });

    return activeAssignments.map(assignment => ({
      assignmentId: assignment.id,
      bookingId: assignment.booking.id,
      bookingDate: assignment.booking.bookingDate,
      status: assignment.booking.status,
      customerEmail: assignment.booking.customer?.account?.email,
    }));
  }

  async checkEmployeeHasActiveShifts(employeeId: string): Promise<boolean> {
    const vnNow = utcToVNDate(new Date());
    const vnToday = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate());
    const vnTodayUtc = vnToUtcDate(vnToday);

    const activeSchedule = await this.prisma.workSchedule.findFirst({
      where: {
        employeeId,
        date: { gte: vnTodayUtc },
      },
      include: { shift: true },
    });

    if (!activeSchedule) return false;

    const scheduleVNDate = utcToVNDate(activeSchedule.date);

    // Future schedule
    if (!isSameDay(scheduleVNDate, vnNow)) return true;

    // Today's schedule - check if shift has ended
    if (activeSchedule.shift?.endTime) {
      const endTimeStr = String(activeSchedule.shift.endTime);
      const [endHour, endMinute] = endTimeStr.split(':').map(Number);

      const shiftEndToday = new Date(
        scheduleVNDate.getFullYear(),
        scheduleVNDate.getMonth(),
        scheduleVNDate.getDate(),
        endHour,
        endMinute,
        0
      );

      return vnNow < shiftEndToday;
    }

    return false;
  }

  async assignEmployeeToServiceCenter(
    employeeId: string,
    workCenterData: UpdateEmployeeWithCenterDTO
  ) {
    const { centerId, startDate, endDate } = workCenterData;

    const parsedStartDate = parseDate(startDate);
    const parsedEndDate = endDate ? parseDate(endDate) : null;

    if (!parsedStartDate) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { startDate: 'Invalid start date format (expected: YYYY-MM-DD)' },
      });
    }

    if (endDate && !parsedEndDate) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { endDate: 'Invalid end date format (expected: YYYY-MM-DD)' },
      });
    }

    const start = vnToUtcDate(parsedStartDate);
    const end = parsedEndDate ? vnToUtcDate(parsedEndDate) : null;

    const employee = await this.prisma.employee.findUnique({
      where: { accountId: employeeId },
      include: {
        account: { select: { role: true } },
        workCenters: {
          where: {
            OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
          },
          include: { serviceCenter: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const currentAssignment = employee.workCenters[0];

    if (!centerId || centerId.trim() === '') {
      if (!currentAssignment) {
        return {
          employeeId,
          workCenter: { id: null, name: 'Not assigned' },
        };
      }
      const hasActiveShifts = await this.checkEmployeeHasActiveShifts(employeeId);
      if (hasActiveShifts) {
        throw new ConflictException(
          'Cannot remove service center assignment: Employee has active/upcoming shifts. Please complete or cancel shifts first.'
        );
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

    if (!serviceCenter) {
      throw new NotFoundException(`Service center with ID ${centerId} not found`);
    }

    if (serviceCenter.status === CenterStatus.CLOSED) {
      throw new BadRequestException('Cannot assign employee to a closed service center');
    }

    if (currentAssignment?.centerId === centerId) {
      const updatedAssignment = await this.prisma.workCenter.update({
        where: { id: currentAssignment.id },
        data: { startDate: start, endDate: end },
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
        workCenter: updatedAssignment.serviceCenter,
      };
    }

    if (currentAssignment && currentAssignment.centerId !== centerId) {
      const hasActiveShifts = await this.checkEmployeeHasActiveShifts(employeeId);
      if (hasActiveShifts) {
        throw new ConflictException(
          'Cannot change service center: Employee has active/upcoming shifts. Please complete or cancel shifts first.'
        );
      }

      await this.prisma.workCenter.update({
        where: { id: currentAssignment.id },
        data: { endDate: new Date() },
      });
    }
    const newAssignment = await this.prisma.workCenter.create({
      data: {
        employeeId,
        centerId,
        startDate: start,
        endDate: end,
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

    if (!employeeId) {
      throw new BadRequestException('Employee ID is required');
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new BadRequestException('No update data provided');
    }

    const existing = await this.prisma.account.findUnique({
      where: { id: employeeId },
      include: {
        employee: {
          include: {
            workCenters: {
              where: {
                OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Account not found');
    }

    if (!existing.employee) {
      throw new NotFoundException('Employee not found');
    }
    const isTechnician = existing.role === AccountRole.TECHNICIAN;
    if (isTechnician) {
      const hasActiveBookings = await this.checkTechnicianHasAssigned(employeeId);

      if (hasActiveBookings) {
        const bookingCount = (await this.getTechnicianActiveBookings(employeeId)).length;

        if (status && ['DISABLED', 'BANNED'].includes(status)) {
          throw new ConflictException(
            `Cannot change technician status while ${bookingCount} booking(s) are still active`
          );
        }

        if (workCenter) {
          const { centerId } = workCenter;
          const currentAssignment = existing.employee.workCenters[0];
          const isRemoving = !centerId || centerId.trim() === '';
          const isChanging =
            currentAssignment && centerId && currentAssignment.centerId !== centerId;

          if (isRemoving || isChanging) {
            throw new ConflictException(
              `Cannot modify service center while ${bookingCount} booking(s) are still active`
            );
          }
        }
      }
    }

    const errors: Record<string, string> = {};

    if (firstName !== undefined) {
      if (!firstName || firstName.trim() === '') {
        errors.firstName = 'First name is required and cannot be empty';
      } else {
        const nameRegex = /^[\p{L}\s'-]{2,30}$/u;
        if (!nameRegex.test(firstName)) {
          errors.firstName =
            'First name must be 2-30 characters and contain only letters, spaces, apostrophes, and hyphens';
        }
      }
    }

    if (lastName !== undefined) {
      if (!lastName || lastName.trim() === '') {
        errors.lastName = 'Last name is required and cannot be empty';
      } else {
        const nameRegex = /^[\p{L}\s'-]{1,30}$/u;
        if (!nameRegex.test(lastName)) {
          errors.lastName =
            'Last name must be 1-30 characters and contain only letters, spaces, apostrophes, and hyphens';
        }
      }
    }

    if (phone !== undefined) {
      if (!phone || phone.trim() === '') {
        errors.phone = 'Phone is required and cannot be empty';
      } else {
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone)) {
          errors.phone = 'Phone must be 10-11 digits';
        }
      }
    }

    if (status !== undefined) {
      if (!status || (typeof status === 'string' && status.trim() === '')) {
        errors.status = 'Status is required and cannot be empty';
      } else {
        const validStatuses = Object.values(AccountStatus);
        if (!validStatuses.includes(status)) {
          errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
        }
      }
    }

    if (workCenter !== undefined) {
      const { centerId } = workCenter;
      const currentAssignment = existing.employee.workCenters[0];

      this.validateWorkCenter(workCenter, errors);

      if (centerId !== undefined) {
        const isRemoving = !centerId || centerId.trim() === '';
        const isChanging = currentAssignment && centerId && currentAssignment.centerId !== centerId;

        if (isRemoving || isChanging) {
          const hasActiveShifts = await this.checkEmployeeHasActiveShifts(employeeId);
          if (hasActiveShifts) {
            errors['workCenter.centerId'] =
              'Cannot change or remove service center: Employee has active/upcoming shifts. Please complete or cancel shifts first.';
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    const accountData: Partial<Prisma.AccountUpdateInput> = {};
    if (phone !== undefined) accountData.phone = phone;
    if (status !== undefined) accountData.status = status;

    if (Object.keys(accountData).length > 0) {
      await this.prisma.account.update({
        where: { id: employeeId },
        data: accountData,
      });
    }

    const employeeData: Partial<Prisma.EmployeeUpdateInput> = {};
    if (firstName !== undefined) employeeData.firstName = firstName;
    if (lastName !== undefined) employeeData.lastName = lastName;

    if (Object.keys(employeeData).length > 0) {
      await this.prisma.employee.update({
        where: { accountId: employeeId },
        data: employeeData,
      });
    }

    if (workCenter) {
      await this.assignEmployeeToServiceCenter(employeeId, workCenter);
    }

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

    if (!updated?.employee) {
      throw new Error('Failed to retrieve updated employee data');
    }

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
            startDate: updated.employee.workCenters[0].startDate,
            endDate: updated.employee.workCenters[0].endDate,
          }
        : { id: null, name: 'Not assigned' },
    };

    return plainToInstance(EmployeeWithCenterDTO, transformed, {
      excludeExtraneousValues: true,
    });
  }

  async createEmployee(
    createData: CreateTechnicianDTO | CreateStaffDTO,
    role: AccountRole
  ): Promise<EmployeeWithCenterDTO> {
    const { email, phone, firstName, lastName, workCenter } = createData;

    const errors: Record<string, string> = {};

    if (!email || email.trim() === '') {
      errors.email = 'Email is required and cannot be empty';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Email must be a valid email address';
      } else {
        const existingAccount = await this.prisma.account.findUnique({
          where: { email },
        });
        if (existingAccount) {
          errors.email = 'Email is already exists';
        }
      }
    }

    if (firstName !== undefined) {
      if (!firstName || firstName.trim() === '') {
        errors.firstName = 'First name is required and cannot be empty';
      } else {
        const nameRegex = /^[\p{L}\s'-]{2,30}$/u;
        if (!nameRegex.test(firstName)) {
          errors.firstName =
            'First name must be 2-30 characters and contain only letters, spaces, apostrophes, and hyphens';
        }
      }
    }

    if (lastName !== undefined) {
      if (!lastName || lastName.trim() === '') {
        errors.lastName = 'Last name is required and cannot be empty';
      } else {
        const nameRegex = /^[\p{L}\s'-]{1,30}$/u;
        if (!nameRegex.test(lastName)) {
          errors.lastName =
            'Last name must be 1-30 characters and contain only letters, spaces, apostrophes, and hyphens';
        }
      }
    }
    if (phone !== undefined) {
      if (!phone || phone.trim() === '') {
        errors.phone = 'Phone is required and cannot be empty';
      } else {
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone)) {
          errors.phone = 'Phone must be 10-11 digits';
        }
      }
    }

    if (workCenter !== undefined) {
      const { centerId, startDate, endDate } = workCenter;

      if (centerId !== undefined) {
        if (!centerId || centerId.trim() === '') {
          errors['workCenter.centerId'] = 'Service Center ID is required and cannot be empty';
        } else {
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(centerId)) {
            errors['workCenter.centerId'] = 'Service Center ID must be a valid UUID';
          }
        }
      }

      if (startDate !== undefined) {
        if (!startDate || startDate.trim() === '') {
          errors['workCenter.startDate'] = 'Start date is required and cannot be empty';
        } else if (isNaN(Date.parse(startDate))) {
          errors['workCenter.startDate'] = 'Start date must be a valid ISO date string';
        }
      }

      if (endDate !== undefined && endDate !== '') {
        if (isNaN(Date.parse(endDate))) {
          errors['workCenter.endDate'] = 'End date must be a valid ISO date string';
        }
      }

      if (
        startDate &&
        startDate.trim() !== '' &&
        endDate &&
        endDate.trim() !== '' &&
        !isNaN(Date.parse(startDate)) &&
        !isNaN(Date.parse(endDate)) &&
        new Date(startDate) >= new Date(endDate)
      ) {
        errors['workCenter.dateRange'] = 'Start date must be before end date';
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Check if email already exists
    const existingAccount = await this.prisma.account.findUnique({
      where: { email },
    });

    if (existingAccount) {
      throw new BadRequestException('Email is already exists');
    }

    // Get default password from config
    let defaultPassword: string | undefined;

    if (role === AccountRole.TECHNICIAN) {
      defaultPassword = this.configService.get<string>('DEFAULT_TECHNICIAN_PASSWORD');
      if (!defaultPassword) {
        throw new Error('DEFAULT_TECHNICIAN_PASSWORD is not set in environment variables');
      }
    } else if (role === AccountRole.STAFF) {
      defaultPassword = this.configService.get<string>('DEFAULT_STAFF_PASSWORD');
      if (!defaultPassword) {
        throw new Error('DEFAULT_STAFF_PASSWORD is not set in environment variables');
      }
    } else {
      throw new Error(`Unsupported role: ${role}`);
    }

    // Create account and employee in transaction
    const result = await this.prisma.$transaction(async tx => {
      // Create account
      const account = await tx.account.create({
        data: {
          email,
          phone,
          password: await hashPassword(defaultPassword!),
          role,
          status: 'VERIFIED',
        },
      });

      // Create employee profile
      await tx.employee.create({
        data: {
          accountId: account.id,
          firstName,
          lastName,
        },
      });

      return account.id;
    });

    // Assign work center if provided
    if (workCenter) {
      await this.assignEmployeeToServiceCenter(result, workCenter);
    }

    // Fetch complete employee data (same as getEmployees logic)
    const createdEmployee = await this.prisma.account.findUnique({
      where: { id: result },
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
                startDate: 'desc',
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!createdEmployee?.employee) {
      throw new Error('Failed to create employee');
    }

    // Transform data (same logic as getEmployees)
    const transformed = {
      id: createdEmployee.id,
      email: createdEmployee.email,
      phone: createdEmployee.phone,
      role: createdEmployee.role,
      status: createdEmployee.status,
      avatar: createdEmployee.avatar,
      createdAt: createdEmployee.createdAt,
      updatedAt: createdEmployee.updatedAt,
      profile: {
        firstName: createdEmployee.employee.firstName,
        lastName: createdEmployee.employee.lastName,
        createdAt: createdEmployee.employee.createdAt,
        updatedAt: createdEmployee.employee.updatedAt,
        certificates:
          createdEmployee.employee.certificates?.map(c => ({
            name: c.name,
            issuedAt: c.issuedAt,
            expiresAt: c.expiresAt,
          })) ?? [],
      },
      workCenter: createdEmployee.employee.workCenters?.[0]?.serviceCenter
        ? {
            id: createdEmployee.employee.workCenters[0].serviceCenter.id,
            name: createdEmployee.employee.workCenters[0].serviceCenter.name,
            address: createdEmployee.employee.workCenters[0].serviceCenter.address,
            status: createdEmployee.employee.workCenters[0].serviceCenter.status,
            startDate: createdEmployee.employee.workCenters[0].startDate,
            endDate: createdEmployee.employee.workCenters[0].endDate,
          }
        : {
            id: null,
            name: 'Not assigned',
            startDate: null,
            endDate: null,
          },
    };

    return plainToInstance(EmployeeWithCenterDTO, transformed, {
      excludeExtraneousValues: true,
    });
  }

  async getAllEmployees(filter: EmployeeQueryDTO): Promise<EmployeeWithCenterDTO[]> {
    const { orderBy = 'asc', sortBy = 'createdAt' } = filter;

    const where: Prisma.AccountWhereInput = {
      role: { in: [AccountRole.STAFF, AccountRole.TECHNICIAN] },
    };

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

    if (filter.search) {
      const search = filter.search.trim();
      const searchConditions: Prisma.AccountWhereInput[] = [
        { email: { contains: search, mode: 'insensitive' } },
        { employee: { firstName: { contains: search, mode: 'insensitive' } } },
        { employee: { lastName: { contains: search, mode: 'insensitive' } } },
        {
          employee: {
            AND: [
              { firstName: { contains: search.split(' ')[0] || '', mode: 'insensitive' } },
              { lastName: { contains: search.split(' ')[1] || '', mode: 'insensitive' } },
            ],
          },
        },
      ];

      where.OR = searchConditions;
    }

    // WorkCenter assignment status filter
    if (filter.hasWorkCenter !== undefined) {
      if (filter.hasWorkCenter) {
        employeeConditions.push({
          workCenters: {
            some: {
              OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
            },
          },
        });
      } else {
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

      workCenterConditions.OR = [{ endDate: null }, { endDate: { gt: new Date() } }];

      if (filter.hasWorkCenter !== false) {
        employeeConditions.push({
          workCenters: { some: workCenterConditions },
        });
      }
    }

    if (employeeConditions.length > 0) {
      employeeWhere.AND = employeeConditions;
    }

    where.employee = employeeWhere;

    const data = await this.prisma.account.findMany({
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
                OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
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
              orderBy: { startDate: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { [sortBy]: orderBy },
    });

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
            startDate: emp.employee.workCenters[0].startDate,
            endDate: emp.employee.workCenters[0].endDate,
          }
        : {
            id: null,
            name: 'Not assigned',
            startDate: null,
            endDate: null,
          },
    }));

    return plainToInstance(EmployeeWithCenterDTO, transformedData, {
      excludeExtraneousValues: true,
    });
  }
}
