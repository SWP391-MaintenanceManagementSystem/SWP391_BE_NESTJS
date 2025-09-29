import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { AccountRole, AccountStatus, Employee, Prisma } from '@prisma/client';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { FilterOptionsDTO } from 'src/common/dto/filter-options.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { AccountService } from 'src/modules/account/account.service';
import { StaffDTO } from './dto/staff.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
import { hashPassword } from 'src/utils';
import { ConfigService } from '@nestjs/config';
import { EmployeeQueryDTO } from '../dto/employee-query.dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly configService: ConfigService) { }

  async getStaffs(options: EmployeeQueryDTO
  ): Promise<PaginationResponse<AccountWithProfileDTO>> {
    let { page = 1, pageSize = 10, orderBy = 'asc', sortBy = 'createdAt' } = options;
    page < 1 && (page = 1);
    pageSize < 1 && (pageSize = 10);

    const where: Prisma.AccountWhereInput = {
      employee: {
        firstName: options?.firstName,
        lastName: options?.lastName,
      },
      email: options?.email,
      phone: options?.phone,
      status: options?.status,
      role: AccountRole.STAFF,
    };

    return await this.accountService.getAccounts(
      where,
      sortBy,
      orderBy,
      page,
      pageSize
    );
  }

  async getStaffById(accountId: string): Promise<StaffDTO | null> {
    const staff = await this.prisma.employee.findUnique({
      where: { accountId },
      include: { account: true }
      ,
    });
    if (!staff || staff.account.role !== AccountRole.STAFF) {
      return null;
    }
    return plainToInstance(StaffDTO, staff);
  }

  async createStaff(dto: CreateStaffDto): Promise<Employee | null> {
    const defaultPassword = this.configService.get<string>('DEFAULT_STAFF_PASSWORD') || 'Staff123!';
    const staffAccount = await this.prisma.account.create({
      data: {
        email: dto.email,
        password: await hashPassword(defaultPassword),
        phone: dto.phone,
        role: AccountRole.STAFF,
        status: 'VERIFIED',

      },
    });


    const employee = await this.prisma.employee.create({
      data: {
        accountId: staffAccount.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return employee;
  }

  async updateStaff(
    accountId: string,
    updateStaffDto: UpdateStaffDto,
  ): Promise<StaffDTO> {
    const existingStaff = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { employee: true },
    });
    if (!existingStaff || existingStaff.role !== AccountRole.STAFF) {
      throw new NotFoundException(`Staff with ID ${accountId} not found`);
    }


    if (updateStaffDto.email || updateStaffDto.password) {
      throw new ConflictException(
        'Updating email and password is not allowed via this endpoint',
      );
    }

    const updateAccount: any = {};
    if (updateStaffDto.phone !== undefined) {
      updateAccount.phone = updateStaffDto.phone;
    }
    if (Object.keys(updateAccount).length > 0) {
      await this.prisma.account.update({
        where: { id: accountId },
        data: updateAccount,
      });
    }


    const updateEmployee: any = {};
    if (updateStaffDto.firstName !== undefined) {
      updateEmployee.firstName = updateStaffDto.firstName;
    }
    if (updateStaffDto.lastName !== undefined) {
      updateEmployee.lastName = updateStaffDto.lastName;
    }

    if (Object.keys(updateEmployee).length > 0) {
      if (existingStaff.employee) {
        await this.prisma.employee.update({
          where: { accountId },
          data: updateEmployee,
        });
      }
    }

    const updatedStaff = await this.getStaffById(accountId);
    if (!updatedStaff) {
      throw new NotFoundException(
        `Staff with ID ${accountId} not found after update`,
      );
    }
    return updatedStaff;
  }

  async deleteStaff(accountId: string): Promise<{ message: string }> {
    const staff = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!staff || staff.role !== AccountRole.STAFF) {
      throw new NotFoundException(`Staff with ID ${accountId} not found`);
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

    const defaultPassword =
      this.configService.get<string>('DEFAULT_STAFF_PASSWORD') ||
      'Staff123!';

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        password: await hashPassword(defaultPassword),
      },
    });

    return { message: "Staff's password reset successfully" };
  }
}
