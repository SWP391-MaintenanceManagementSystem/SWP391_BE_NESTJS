import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { AccountRole, AccountStatus, Employee, Prisma } from '@prisma/client';
import { CreateStaffDTO } from './dto/create-staff.dto';
import { UpdateStaffDTO } from './dto/update-staff.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { AccountService } from 'src/modules/account/account.service';
import { StaffDTO } from './dto/staff.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
import { hashPassword } from 'src/utils';
import { ConfigService } from '@nestjs/config';
import { EmployeeQueryDTO, EmployeeQueryWithPaginationDTO } from '../dto/employee-query.dto';
import { EmployeeWithCenterDTO } from '../dto/employee-with-center.dto';
import { EmployeeService } from '../employee.service';
import { CertificateService } from '../certificate/certificate.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { NotificationTemplateService } from 'src/modules/notification/notification-template.service';

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly configService: ConfigService,
    private readonly employeeService: EmployeeService,
    private readonly certificateService: CertificateService,
    private readonly notificationService: NotificationService
  ) {}

  async getStaffs(
    filter: EmployeeQueryWithPaginationDTO
  ): Promise<PaginationResponse<EmployeeWithCenterDTO>> {
    return this.employeeService.getEmployees(filter, AccountRole.STAFF);
  }

  async getStaffById(accountId: string): Promise<AccountWithProfileDTO | null> {
    const staff = await this.accountService.getAccountById(accountId);
    if (!staff || staff.role !== AccountRole.STAFF) {
      throw new NotFoundException(`Staff with ID ${accountId} not found`);
    }
    return plainToInstance(AccountWithProfileDTO, staff);
  }

  async createStaff(createStaffDto: CreateStaffDTO): Promise<EmployeeWithCenterDTO> {
    return this.employeeService.createEmployee(createStaffDto, 'STAFF');
  }

  async updateStaff(id: string, updateData: UpdateStaffDTO): Promise<EmployeeWithCenterDTO> {
    const existingStaff = await this.prisma.account.findUnique({
      where: { id, role: 'STAFF' },
      include: { employee: true },
    });

    if (!existingStaff || !existingStaff.employee) {
      throw new NotFoundException('Staff not found');
    }
    const result = await this.employeeService.updateEmployee(id, updateData);

    // Send notifications based on what changed
    const notificationPromises: Promise<void>[] = [];

    // Profile updated
    if (result.notifications.profileUpdated) {
      const template = NotificationTemplateService.employeeProfileUpdated();
      notificationPromises.push(
        this.notificationService.sendNotification(
          id,
          typeof template.message === 'function'
            ? template.message({})
            : 'Your profile has been updated by an administrator.',
          template.type!,
          template.title as string
        )
      );
    }

    // Center removed
    if (result.notifications.centerRemoved && result.notifications.oldCenterName) {
      const removeTemplate = NotificationTemplateService.employeeRemovedFromCenter();
      notificationPromises.push(
        this.notificationService.sendNotification(
          id,
          `You have been removed from ${result.notifications.oldCenterName}.`,
          removeTemplate.type!,
          removeTemplate.title as string
        )
      );
    }

    // Center assigned
    if (result.notifications.centerUpdated && result.notifications.newCenterName) {
      const assignTemplate = NotificationTemplateService.employeeAssignedToCenter();
      notificationPromises.push(
        this.notificationService.sendNotification(
          id,
          `You have been assigned to ${result.notifications.newCenterName}.`,
          assignTemplate.type!,
          assignTemplate.title as string
        )
      );
    }

    await Promise.all(notificationPromises);

    return result.data;
  }

  async deleteStaff(accountId: string): Promise<{ message: string }> {
    const staff = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!staff || staff.role !== AccountRole.STAFF) {
      throw new NotFoundException(`Staff with ID ${accountId} not found`);
    }

    if (staff.status === AccountStatus.DISABLED) {
      throw new BadRequestException('Staff is already disabled');
    }

    if (await this.employeeService.checkEmployeeHasActiveShifts(accountId)) {
      throw new BadRequestException('Cannot disable staff with active shifts');
    }

    await this.prisma.account.update({
      where: { id: accountId },
      data: { status: AccountStatus.DISABLED },
    });

    return { message: 'Staff has been disabled successfully' };
  }

  async resetStaffPassword(accountId: string): Promise<{ message: string }> {
    const staff = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { employee: true },
    });

    if (!staff || staff.role !== AccountRole.STAFF) {
      throw new NotFoundException(`Staff with ID ${accountId} not found`);
    }

    const defaultPassword = this.configService.get<string>('DEFAULT_STAFF_PASSWORD') || 'Staff123!';

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        password: await hashPassword(defaultPassword),
      },
    });

    return { message: "Staff's password reset successfully" };
  }

  async getStaffStatistics() {
    const [verified, notVerified, banned, disabled, total] = await Promise.all([
      this.prisma.account.count({
        where: { role: AccountRole.STAFF, status: AccountStatus.VERIFIED },
      }),
      this.prisma.account.count({
        where: { role: AccountRole.STAFF, status: AccountStatus.NOT_VERIFY },
      }),
      this.prisma.account.count({
        where: { role: AccountRole.STAFF, status: AccountStatus.BANNED },
      }),
      this.prisma.account.count({
        where: { role: AccountRole.STAFF, status: AccountStatus.DISABLED },
      }),
      this.prisma.account.count({ where: { role: AccountRole.STAFF } }),
    ]);

    const data = [
      {
        status: 'VERIFIED',
        count: verified,
        percentage: total > 0 ? Math.round((verified / total) * 10000) / 100 : 0,
      },
      {
        status: 'NOT_VERIFY',
        count: notVerified,
        percentage: total > 0 ? Math.round((notVerified / total) * 10000) / 100 : 0,
      },
      {
        status: 'BANNED',
        count: banned,
        percentage: total > 0 ? Math.round((banned / total) * 10000) / 100 : 0,
      },
      {
        status: 'DISABLED',
        count: disabled,
        percentage: total > 0 ? Math.round((disabled / total) * 10000) / 100 : 0,
      },
    ].filter(item => item.count > 0);

    return {
      total,
      data,
    };
  }

  async getStaffDashboard(accountId: string): Promise<{
    totalCustomers: number;
    newTickets: number;
    bookingOverview: {
      total: number;
      bookingStatistics: Array<{ name: string; value: number }>;
    };
  }> {
    const employee = await this.prisma.employee.findUnique({
      where: { accountId },
      include: {
        workCenters: {
          where: {
            OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
          },
          include: { serviceCenter: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!employee) throw new BadRequestException('Staff not found');

    const currentServiceCenterId = employee.workCenters[0]?.serviceCenter?.id;

    const bookingWhere = {
      OR: [
        { bookingAssignments: { some: { employeeId: employee.accountId } } },
        { bookingAssignments: { some: { assignedBy: employee.accountId } } },
        ...(currentServiceCenterId ? [{ centerId: currentServiceCenterId }] : []),
      ],
    };

    const statusGroups = await this.prisma.booking.groupBy({
      by: ['status'],
      where: bookingWhere,
      _count: { status: true },
    });

    const bookingStatusMap = new Map<string, number>();
    statusGroups.forEach(g => bookingStatusMap.set(g.status, g._count.status));

    const [totalBookings, newTickets, totalCustomers] = await Promise.all([
      this.prisma.booking.count({ where: bookingWhere }),
      this.prisma.conversation.count({
        where: { staffId: null },
      }),

      this.prisma.account.count({
        where: {
          role: AccountRole.CUSTOMER,
          status: AccountStatus.VERIFIED,
        },
      }),
    ]);

    const allStatuses = [
      { key: 'PENDING', label: 'Pending' },
      { key: 'ASSIGNED', label: 'Assigned' },
      { key: 'IN_PROGRESS', label: 'In Progress' },
      { key: 'CANCELLED', label: 'Cancelled' },
      { key: 'CHECKED_IN', label: 'Checked In' },
      { key: 'CHECKED_OUT', label: 'Checked Out' },
      { key: 'COMPLETED', label: 'Completed' },
    ];

    const bookingStatistics = allStatuses.map(({ key, label }) => ({
      name: label,
      value: bookingStatusMap.get(key) ?? 0,
    }));

    return {
      totalCustomers,
      newTickets,
      bookingOverview: {
        total: totalBookings,
        bookingStatistics,
      },
    };
  }
}
