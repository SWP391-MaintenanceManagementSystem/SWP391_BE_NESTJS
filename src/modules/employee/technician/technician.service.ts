import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateTechnicianDTO } from './dto/create-technician.dto';
import { UpdateTechnicianDTO } from './dto/update-technician.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { Employee, AccountRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { AccountService } from 'src/modules/account/account.service';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { hashPassword } from 'src/utils';
import { ConflictException } from '@nestjs/common/exceptions/conflict.exception';
import { EmployeeQueryDTO } from '../dto/employee-query.dto';
import { ConfigService } from '@nestjs/config';
import { AccountStatus } from '@prisma/client';
import { EmployeeWithCenterDTO } from '../dto/employee-with-center.dto';
import { UpdateEmployeeWithCenterDTO } from '../dto/update-employee-with-center.dto';
import { EmployeeService } from '../employee.service';

@Injectable()
export class TechnicianService {
  constructor(
    private prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly configService: ConfigService,
    private readonly employeeService: EmployeeService
  ) {}

  async createTechnician(createTechnicianDto: CreateTechnicianDTO): Promise<Employee | null> {
    const defaultPassword = this.configService.get<string>('DEFAULT_TECHNICIAN_PASSWORD');
    if (!defaultPassword) {
      throw new Error('DEFAULT_TECHNICIAN_PASSWORD is not set in environment variables');
    }

    if (createTechnicianDto.email) {
      const existingAccount = await this.prisma.account.findUnique({
        where: { email: createTechnicianDto.email },
      });
      if (existingAccount) {
        throw new ConflictException('Email is already exists');
      }
    }

    const technicianAccount = await this.prisma.account.create({
      data: {
        email: createTechnicianDto.email,
        password: await hashPassword(defaultPassword),
        role: AccountRole.TECHNICIAN,
        phone: createTechnicianDto.phone,
        status: 'VERIFIED',
      },
    });

    const employee = await this.prisma.employee.create({
      data: {
        accountId: technicianAccount.id,
        firstName: createTechnicianDto.firstName,
        lastName: createTechnicianDto.lastName ? createTechnicianDto.lastName : '',
      },
    });
    return employee;
  }

  async getTechnicianById(accountId: string): Promise<AccountWithProfileDTO | null> {
    const technician = await this.accountService.getAccountById(accountId);

    if (!technician || technician.role !== AccountRole.TECHNICIAN) {
      throw new NotFoundException(`Technician with ID ${accountId} not found`);
    }
    return plainToInstance(AccountWithProfileDTO, technician);
  }

  async getTechnicians(
    filter: EmployeeQueryDTO
  ): Promise<PaginationResponse<EmployeeWithCenterDTO>> {
    return this.employeeService.getEmployees(filter, AccountRole.TECHNICIAN);
  }

  async updateTechnician(id: string, updateData: UpdateTechnicianDTO) {
    return await this.employeeService.updateEmployee(id, updateData);
  }

  async deleteTechnician(accountId: string): Promise<void> {
    const existingTechnician = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!existingTechnician || existingTechnician.role !== AccountRole.TECHNICIAN) {
      throw new NotFoundException(`Technician with ID ${accountId} not found`);
    }

    await this.prisma.account.update({
      where: { id: accountId },
      data: { status: 'DISABLED' },
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
