import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { EmployeeWithCenterDTO } from '../dto/employee-with-center.dto';
import { EmployeeService } from '../employee.service';
import { CertificateService } from '../certificate/certificate.service';

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly configService: ConfigService,
    private readonly employeeService: EmployeeService,
    private readonly certificateService: CertificateService
  ) {}

  async getStaffs(filter: EmployeeQueryDTO): Promise<PaginationResponse<EmployeeWithCenterDTO>> {
    return this.employeeService.getEmployees(filter, AccountRole.STAFF);
  }

  async getStaffById(accountId: string): Promise<AccountWithProfileDTO | null> {
    const staff = await this.accountService.getAccountById(accountId);
    if (!staff || staff.role !== AccountRole.STAFF) {
      throw new NotFoundException(`Staff with ID ${accountId} not found`);
    }
    return plainToInstance(AccountWithProfileDTO, staff);
  }

  async createStaff(dto: CreateStaffDto): Promise<Employee | null> {

  const existingAccount = await this.prisma.account.findUnique({
    where: { email: dto.email },
  });
  if (existingAccount) {
    throw new BadRequestException('Email is already in use');
  }


  const defaultPassword =
    this.configService.get<string>('DEFAULT_STAFF_PASSWORD') || 'Staff123!';

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


  if (dto.certificates?.length) {
    await Promise.all(
      dto.certificates.map((cert) =>
        this.certificateService.createCertificate(staffAccount.id, cert)
      )
    );
  }


  const result = await this.prisma.employee.findUnique({
    where: { accountId: employee.accountId },
    include: { certificates: true },
  });

  return result;
}

  async updateStaff(
    accountId: string,
    updateStaffDto: UpdateStaffDto
  ): Promise<AccountWithProfileDTO> {
    const updatedStaff = await this.accountService.updateAccount(accountId, updateStaffDto);

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
}
