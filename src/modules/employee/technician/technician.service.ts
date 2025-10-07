import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { Employee, AccountRole, Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { AccountService } from 'src/modules/account/account.service';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { hashPassword } from 'src/utils';
import { ConflictException } from '@nestjs/common/exceptions/conflict.exception';
import { EmployeeQueryDTO } from '../dto/employee-query.dto';
import { ConfigService } from '@nestjs/config';
import { buildAccountOrderBy } from 'src/common/sort/sort.util';
import { AccountStatus } from '@prisma/client';

@Injectable()
export class TechnicianService {
  constructor(
    private prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly configService: ConfigService
  ) {}

  async createTechnician(createTechnicianDto: CreateTechnicianDto): Promise<Employee | null> {
    const defaultPassword = this.configService.get<string>('DEFAULT_TECHNICIAN_PASSWORD');
    if (!defaultPassword) {
      throw new Error('DEFAULT_TECHNICIAN_PASSWORD is not set in environment variables');
    }

    if (createTechnicianDto.email) {
      const existingAccount = await this.prisma.account.findUnique({
        where: { email: createTechnicianDto.email },
      });
      if (existingAccount) {
        throw new BadRequestException('Technician with email is already exists');
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
  ): Promise<PaginationResponse<AccountWithProfileDTO>> {
    let { page = 1, pageSize = 10, orderBy = 'asc', sortBy = 'createdAt' } = filter;
    page < 1 && (page = 1);
    pageSize < 1 && (pageSize = 10);

    const where: Prisma.AccountWhereInput = {
      employee: {
        firstName: { contains: filter?.firstName, mode: 'insensitive' },
        lastName: { contains: filter?.lastName, mode: 'insensitive' },
      },
      email: { contains: filter?.email, mode: 'insensitive' },
      phone: filter?.phone,
      status: filter?.status,
      role: AccountRole.TECHNICIAN,
    };

    return await this.accountService.getAccounts(where, sortBy, orderBy, page, pageSize);
  }

  async updateTechnician(
    accountId: string,
    updateTechnicianDto: UpdateTechnicianDto
  ): Promise<AccountWithProfileDTO> {
    const updatedTechnician = await this.accountService.updateAccount(
      accountId,
      updateTechnicianDto
    );
    return updatedTechnician;
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
