import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { AccountRole, Employee, Prisma } from '@prisma/client';
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
        status: 'VERIFIED', // Kiểm tra xem các trường này có đúng với schema không
        // Bổ sung các trường khác nếu cần
      },
    });

    // Tạo thông tin nhân viên liên kết với tài khoản
    const employee = await this.prisma.employee.create({
      data: {
        accountId: staffAccount.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return employee;
  }

  async updateStaff(accountId: string, updateStaffDto: UpdateStaffDto): Promise<StaffDTO> {
    const existingStaff = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { employee: true },
    });
    if (!existingStaff || existingStaff.role !== AccountRole.STAFF) {
      throw new NotFoundException(`Staff with ID ${accountId} not found`);
    }

    // Check trùng email
    if (
      updateStaffDto.email &&
      updateStaffDto.email !== existingStaff.email
    ) {
      const emailExists = await this.prisma.account.findUnique({
        where: { email: updateStaffDto.email },
      });
      if (emailExists) {
        throw new ConflictException(
          `Email ${updateStaffDto.email} already exists`,
        );
      }
    }

    // Update account fields
    const updateAccount: any = {};
    if (updateStaffDto.email !== undefined) {
      updateAccount.email = updateStaffDto.email;
    }
    if (updateStaffDto.phone !== undefined) {
      updateAccount.phone = updateStaffDto.phone;
    }
    if (updateStaffDto.password !== undefined) {
      updateAccount.password = await hashPassword(updateStaffDto.password);
    }

    if (Object.keys(updateAccount).length > 0) {
      await this.prisma.account.update({
        where: { id: accountId },
        data: updateAccount,
      });
    }

    // Update employee fields
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
    const updateStaff = await this.getStaffById(accountId);
    if (!updateStaff) {
      throw new NotFoundException(`Staff with ID ${accountId} not found after update`);
    }
    return updateStaff;
  }

  // async deleteStaff(accountId: string) {
  //   const staff = await this.prisma.employee.findUnique({
  //     where: { accountId },
  //     include: { account: true },
  //   });
  //   if (!staff || staff.account.role !== AccountRole.STAFF) throw new NotFoundException(`Staff with id ${accountId} not found`);

  //   await this.prisma.employee.delete({ where: { accountId } });
  // }
  async resetStaffPassword(accountId: string): Promise<void> {
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
  }
}