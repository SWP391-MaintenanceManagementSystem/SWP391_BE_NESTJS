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
import { EmployeeQueryDTO, EmployeeQueryWithPaginationDTO } from '../dto/employee-query.dto';
import { ConfigService } from '@nestjs/config';
import { AccountStatus } from '@prisma/client';
import { EmployeeWithCenterDTO } from '../dto/employee-with-center.dto';
import { EmployeeService } from '../employee.service';

@Injectable()
export class TechnicianService {
  constructor(
    private prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly configService: ConfigService,
    private readonly employeeService: EmployeeService
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

    return await this.employeeService.updateEmployee(id, updateData);
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
      throw new BadRequestException('Cannot delete technician with active shifts');
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

  async getBookingStatisticsByTechnician(technicianId: string): Promise<{
  totalBookings: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionRate: number;
}> {

  const technician = await this.prisma.account.findUnique({
    where: { id: technicianId },
    select: { role: true },
  });

  if (!technician || technician.role !== AccountRole.TECHNICIAN) {
    throw new NotFoundException(`Technician with ID ${technicianId} not found`);
  }


  const assignments = await this.prisma.bookingAssignment.findMany({
    where: {
      employeeId: technicianId,
    },
    select: {
      booking: {
        select: { status: true },
      },
    },
  });


  const stats = {
    [BookingStatus.COMPLETED]: 0,
    [BookingStatus.IN_PROGRESS]: 0,
    [BookingStatus.PENDING]: 0,
    [BookingStatus.ASSIGNED]: 0,
    [BookingStatus.CHECKED_IN]: 0,
    [BookingStatus.CHECKED_OUT]: 0,
    [BookingStatus.CANCELLED]: 0,
  };

  assignments.forEach(assign => {
    const status = assign.booking.status;
    stats[status] = (stats[status] || 0) + 1;
  });

  const totalBookings = assignments.length;

  const completed = stats[BookingStatus.COMPLETED] + stats[BookingStatus.CHECKED_OUT] || 0;
  const inProgress = stats[BookingStatus.IN_PROGRESS] || 0;
  const pending =
    stats[BookingStatus.PENDING] +
    stats[BookingStatus.ASSIGNED] +
    stats[BookingStatus.CHECKED_IN];

  const completionRate = totalBookings > 0
    ? Math.round((completed / totalBookings) * 100)
    : 0;

  return {
    totalBookings,
    completed,
    inProgress,
    pending,
    completionRate,
  };
}
}
