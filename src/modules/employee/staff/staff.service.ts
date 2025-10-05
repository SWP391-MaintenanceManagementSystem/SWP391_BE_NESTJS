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
  constructor(
    private prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly configService: ConfigService
  ) {}

  async getStaffs(options: EmployeeQueryDTO): Promise<PaginationResponse<AccountWithProfileDTO>> {
    let { page = 1, pageSize = 10, orderBy = 'asc', sortBy = 'createdAt' } = options;
    page < 1 && (page = 1);
    pageSize < 1 && (pageSize = 10);

    const where: Prisma.AccountWhereInput = {
      employee: {
        firstName: { contains: options?.firstName , mode: 'insensitive' },
        lastName: { contains: options?.lastName , mode: 'insensitive' },
      },
      email: { contains: options?.email , mode: 'insensitive' },
      phone: options?.phone,
      status: options?.status,
      role: AccountRole.STAFF,
    };



    return await this.accountService.getAccounts(where, sortBy, orderBy, page, pageSize);
  }

  async getStaffById(accountId: string): Promise<AccountWithProfileDTO | null> {
    const staff = await this.accountService.getAccountById(accountId);
    if (!staff || staff.role !== AccountRole.STAFF) {
      throw new NotFoundException(`Staff with ID ${accountId} not found`);
    }
    return plainToInstance(AccountWithProfileDTO, staff);
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

  async updateStaff(accountId: string,updateStaffDto: UpdateStaffDto,): Promise<AccountWithProfileDTO> {

    const updatedStaff = await this.accountService.updateAccount(accountId,  updateStaffDto);

    return plainToInstance(AccountWithProfileDTO, updatedStaff);

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

    const defaultPassword = this.configService.get<string>('DEFAULT_STAFF_PASSWORD') || 'Staff123!';

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        password: await hashPassword(defaultPassword),
      },
    });

    return { message: "Staff's password reset successfully" };
  }

  async getStaffStatusStats(): Promise<{ status: string; staffs: number }[]> {
  const grouped = await this.prisma.account.groupBy({
    by: ['status'],
    where: {
      role: AccountRole.STAFF,
    },
    _count: {
      status: true,
    },
  });


  const stats = grouped.map(item => ({
    status: item.status.toLowerCase(),
    staffs: item._count.status,
  }));

  return stats;
}
}
