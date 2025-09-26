import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class TechnicianService {
  constructor(
    private prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly configService: ConfigService
  ) { }

  async createTechnician(createTechnicianDto: CreateTechnicianDto): Promise<Employee | null> {
    const defaultPassword = this.configService.get<string>('DEFAULT_TECHNICIAN_PASSWORD') ?? 'Technician123!';

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
    options: EmployeeQueryDTO
  ): Promise<PaginationResponse<AccountWithProfileDTO>> {
    let { page = 1, pageSize = 10, orderBy = 'asc', sortBy = 'createdAt' } = options;
    page < 1 && (page = 1);
    pageSize < 1 && (pageSize = 10);

    const where: Prisma.AccountWhereInput = {
      employee: {
        firstName: { contains: options?.firstName, mode: 'insensitive' },
        lastName: { contains: options?.lastName, mode: 'insensitive' },
      },
      email: { contains: options?.email, mode: 'insensitive' },
      phone: options?.phone,
      status: options?.status,
      role: AccountRole.TECHNICIAN,
    };

    return await this.accountService.getAccounts(
      where,
      sortBy,
      orderBy,
      page,
      pageSize
    );
  }


  async updateTechnician(
    accountId: string,
    updateTechnicianDto: UpdateTechnicianDto
  ): Promise<void> {
    const existingTechnician = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { employee: true },
    });

    if (!existingTechnician || existingTechnician.role !== AccountRole.TECHNICIAN) {
      throw new NotFoundException(`Technician with ID ${accountId} not found`);
    }

    if (
      updateTechnicianDto.email &&
      updateTechnicianDto.email !== existingTechnician.email
    ) {
      const emailExists = await this.prisma.account.findUnique({
        where: { email: updateTechnicianDto.email },
      });
      if (emailExists) {
        throw new ConflictException(
          `Email ${updateTechnicianDto.email} already exists`,
        );
      }
    }

    const updateAccount: any = {};
    if (updateTechnicianDto.email !== undefined) {
      updateAccount.email = updateTechnicianDto.email;
    }
    if (updateTechnicianDto.phone !== undefined) {
      updateAccount.phone = updateTechnicianDto.phone;
    }
    if (updateTechnicianDto.password !== undefined) {
      updateAccount.password = await hashPassword(updateTechnicianDto.password);
    }

    if (Object.keys(updateAccount).length > 0) {
      await this.prisma.account.update({
        where: { id: accountId },
        data: updateAccount,
      });
    }

    const updateEmployee: any = {};
    if (updateTechnicianDto.firstName !== undefined) {
      updateEmployee.firstName = updateTechnicianDto.firstName;
    }
    if (updateTechnicianDto.lastName !== undefined) {
      updateEmployee.lastName = updateTechnicianDto.lastName;
    }

    if (Object.keys(updateEmployee).length > 0) {
      if (existingTechnician.employee) {
        await this.prisma.employee.update({
          where: { accountId },
          data: updateEmployee,
        });
      };
    }
  }

  async deleteTechnician(accountId: string): Promise<void> {
    const existingTechnician = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { employee: true },
    });

    if (!existingTechnician || existingTechnician.role !== AccountRole.TECHNICIAN) {
      throw new NotFoundException(`Technician with ID ${accountId} not found`);
    }

    await this.prisma.account.delete({
      where: { id: accountId },
    });
  }
}