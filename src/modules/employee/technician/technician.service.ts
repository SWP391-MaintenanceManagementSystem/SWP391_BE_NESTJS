import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateTechnicianDTO } from './dto/create-technician.dto';
import { UpdateTechnicianDTO } from './dto/update-technician.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { AccountRole, BookingStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { AccountService } from 'src/modules/account/account.service';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { hashPassword } from 'src/utils';
import { EmployeeQueryWithPaginationDTO } from '../dto/employee-query.dto';
import { ConfigService } from '@nestjs/config';
import { AccountStatus } from '@prisma/client';
import { EmployeeWithCenterDTO } from '../dto/employee-with-center.dto';
import { EmployeeService } from '../employee.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { NotificationTemplateService } from 'src/modules/notification/notification-template.service';

@Injectable()
export class TechnicianService {
  constructor(
    private prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly configService: ConfigService,
    private readonly employeeService: EmployeeService,
    private readonly notificationService: NotificationService
  ) {}

  async createTechnician(createTechnicianDto: CreateTechnicianDTO): Promise<EmployeeWithCenterDTO> {
    return this.employeeService.createEmployee(createTechnicianDto, 'TECHNICIAN');
  }

  async getTechnicianById(accountId: string): Promise<AccountWithProfileDTO | null> {
    const technician = await this.accountService.getAccountById(accountId);

    if (!technician || technician.role !== AccountRole.TECHNICIAN) {
      throw new NotFoundException(`Technician with ID ${accountId} not found`);
    }
    return plainToInstance(AccountWithProfileDTO, technician);
  }

  async getTechnicians(
    filter: EmployeeQueryWithPaginationDTO
  ): Promise<PaginationResponse<EmployeeWithCenterDTO>> {
    return this.employeeService.getEmployees(filter, AccountRole.TECHNICIAN);
  }

  async updateTechnician(
    id: string,
    updateData: UpdateTechnicianDTO
  ): Promise<EmployeeWithCenterDTO> {
    const existingTechnician = await this.prisma.account.findUnique({
      where: { id, role: 'TECHNICIAN' },
      include: { employee: true },
    });

    if (!existingTechnician || !existingTechnician.employee) {
      throw new NotFoundException('Technician not found');
    }

    // ✅ Call updateEmployee
    const result = await this.employeeService.updateEmployee(id, updateData);

    // ✅ Send notifications
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

    // ✅ Center removed
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

    // ✅ Center assigned
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
  async deleteTechnician(accountId: string): Promise<void> {
    const existingTechnician = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!existingTechnician || existingTechnician.role !== AccountRole.TECHNICIAN) {
      throw new NotFoundException(`Technician with ID ${accountId} not found`);
    }

    if (existingTechnician.status === AccountStatus.DISABLED) {
      throw new BadRequestException('Technician is already disabled');
    }

    if (await this.employeeService.checkEmployeeHasActiveShifts(accountId)) {
      throw new BadRequestException('Cannot delete technician with active or upcoming shifts');
    }

    if (await this.employeeService.checkTechnicianHasAssigned(accountId)) {
      throw new BadRequestException('Cannot delete technician with active booking assignments');
    }

    await this.prisma.account.update({
      where: { id: accountId },
      data: { status: AccountStatus.DISABLED },
    });
  }

  async resetDefaultPassword(accountId: string): Promise<void> {
    const defaultPassword = this.configService.get<string>('DEFAULT_TECHNICIAN_PASSWORD');
    if (!defaultPassword) {
      throw new Error('DEFAULT_TECHNICIAN_PASSWORD is not set in environment variables');
    }
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account || account.role !== AccountRole.TECHNICIAN) {
      throw new NotFoundException(`Technician with ID ${accountId} not found`);
    }
    await this.prisma.account.update({
      where: { id: accountId },
      data: { password: await hashPassword(defaultPassword) },
    });
  }

  async getTechnicianStatistics() {
    const [verified, notVerified, banned, disabled, total] = await Promise.all([
      this.prisma.account.count({
        where: {
          role: AccountRole.TECHNICIAN,
          status: AccountStatus.VERIFIED,
        },
      }),
      this.prisma.account.count({
        where: {
          role: AccountRole.TECHNICIAN,
          status: AccountStatus.NOT_VERIFY,
        },
      }),
      this.prisma.account.count({
        where: {
          role: AccountRole.TECHNICIAN,
          status: AccountStatus.BANNED,
        },
      }),
      this.prisma.account.count({
        where: {
          role: AccountRole.TECHNICIAN,
          status: AccountStatus.DISABLED,
        },
      }),
      this.prisma.account.count({
        where: { role: AccountRole.TECHNICIAN },
      }),
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
    return { data, total };
  }
}
