import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { AccountRole, Employee } from '@prisma/client';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { FilterOptionsDTO } from 'src/common/dto/filter-options.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { AccountService } from 'src/modules/account/account.service';
import { StaffDTO } from './dto/staff.dto';
import { plainToClass, plainToInstance } from 'class-transformer';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService, private readonly accountService: AccountService) { }

  async getStaffs(
    options: FilterOptionsDTO<Employee>
  ): Promise<PaginationResponse<AccountWithProfileDTO>> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const pageSize = options.pageSize || 10;
    const where = {
      ...(options.where || {}),
      account: { role: AccountRole.STAFF },
    };
    const { data, total } = await this.accountService.getAccounts({ where, page, pageSize });

    return {
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
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

  async createStaff(dto: CreateStaffDto) {
    const staffAccount = await this.prisma.account.create({
      data: {
        email: dto.email,
        password: dto.password,
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

  async updateStaff(accountId: string, updateStaffDto: UpdateStaffDto): Promise<void> {
    const staff = await this.prisma.employee.findUnique({
      where: {
        accountId,
      },
      include: { account: true },
    })
    if (!staff || staff.account.role !== AccountRole.STAFF) throw new NotFoundException(`Staff with id ${accountId} not found`);

    await this.prisma.account.update({
      where: { id: accountId },
      data: updateStaffDto,
    });
  }

  async deleteStaff(accountId: string) {
    const staff = await this.prisma.employee.findUnique({
      where: { accountId },
      include: { account: true },
    });
    if (!staff || staff.account.role !== AccountRole.STAFF) throw new NotFoundException(`Staff with id ${accountId} not found`);

    await this.prisma.employee.delete({ where: { accountId } });
  }
}