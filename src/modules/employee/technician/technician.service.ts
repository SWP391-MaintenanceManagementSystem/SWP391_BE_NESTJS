import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { Employee, AccountRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { TechnicianDTO } from './dto/technician.dto';
import { FilterTechnicianDto } from './dto/filter-technician.dto';

@Injectable()
export class TechnicianService {
  constructor(private prisma: PrismaService) {}

  async createTechnician(createTechnicianDto: CreateTechnicianDto): Promise<Employee | null> {
    const technicianAccount = await this.prisma.account.create({
      data: {
        email: createTechnicianDto.email,
        password: createTechnicianDto.password,
        role: AccountRole.TECHNICIAN,
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

  async getTechnicianById(accountId: string): Promise<TechnicianDTO | null> {
    const technician = await this.prisma.employee.findUnique({
      where: { accountId },
      include: {
        account: true,
        certificates: true,
      },
    });

    if (!technician || technician.account.role !== AccountRole.TECHNICIAN) {
      return null;
    }

    return plainToInstance(TechnicianDTO, technician);
  }

  async getTechnicians(
    options: FilterTechnicianDto<Employee>
  ): Promise<PaginationResponse<TechnicianDTO>> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const pageSize = options.pageSize || 10;
    const where = {
      ...(options.where || {}),
      account: { role: AccountRole.TECHNICIAN },
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        orderBy: options.orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { account: true, certificates: true },
      }),
      this.prisma.employee.count({ where }),
    ]);
    return {
      data: data.map((item: Employee) => plainToInstance(TechnicianDTO, item)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async updateTechnician(
    accountId: string,
    updateTechnicianDto: UpdateTechnicianDto
  ): Promise<void> {
    const existingTechnician = await this.prisma.employee.findUnique({
      where: { accountId },
      include: { account: true },
    });
    if (!existingTechnician || existingTechnician.account.role !== AccountRole.TECHNICIAN) {
      throw new NotFoundException(`Technician with ID ${accountId} not found`);
    }
    await this.prisma.employee.update({
      where: { accountId },
      data: updateTechnicianDto,
    });
  }

  async deleteTechnician(accountId: string): Promise<void> {
    const existingTechnician = await this.prisma.employee.findUnique({
      where: { accountId },
      include: { account: true },
    });
    if (!existingTechnician || existingTechnician.account.role !== AccountRole.TECHNICIAN) {
      throw new NotFoundException(`Technician with ID ${accountId} not found`);
    }
    await this.prisma.employee.delete({
      where: { accountId },
    });
  }
}
