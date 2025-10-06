import { Body, Controller, Get, Query, Param, Delete, Post, Patch } from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { ApiTags, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { EmployeeQueryDTO } from '../dto/employee-query.dto';
import { plainToInstance } from 'class-transformer';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';

@ApiTags('Technician')
@ApiBearerAuth('jwt-auth')
@Controller('api/technician')
export class TechnicianController {
  constructor(private readonly technicianService: TechnicianService) {}

  @Get('/statistics')
  @Roles(AccountRole.ADMIN)
  async getTechnicianStatistics() {
    const { data, total } = await this.technicianService.getTechnicianStatistics();
    return {
      message: 'Get technician statistics successfully',
      data,
      total,
    };
  }

  @Get('/')
  @Roles(AccountRole.ADMIN)
  async getTechnicians(@Query() query: EmployeeQueryDTO) {
    const { data, page, pageSize, total, totalPages } =
      await this.technicianService.getTechnicians(query);
    return {
      message: 'Technicians retrieved successfully',
      data: plainToInstance(AccountWithProfileDTO, data),
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  @Patch('/:id/reset-password')
  @Roles(AccountRole.ADMIN)
  async resetDefaultPassword(@Param('id') id: string) {
    await this.technicianService.resetDefaultPassword(id);
    return { message: `Technician's password reset successfully`,};
  }

  @Get('/:id')
  @Roles(AccountRole.ADMIN)
  async getTechnicianById(@Param('id') id: string) {
    const data = await this.technicianService.getTechnicianById(id);
    return { data, message: `Technician with ID retrieved successfully` };
  }

  @Post()
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: CreateTechnicianDto })
  async createTechnician(@Body() createTechnicianDto: CreateTechnicianDto) {
    const data = await this.technicianService.createTechnician(createTechnicianDto);
    return { data, message: 'Technician created successfully' };
  }

  @Patch('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: UpdateTechnicianDto })
  async updateTechnician(
    @Param('id') id: string,
    @Body() updateTechnicianDto: UpdateTechnicianDto,
  ) {
    const data = await this.technicianService.updateTechnician(
      id,
      updateTechnicianDto,
    );
    return {
      message: 'Technician updated successfully',
      data: plainToInstance(AccountWithProfileDTO, data),
    };
  }

  @Delete('/:id')
  @Roles(AccountRole.ADMIN)
  async deleteTechnician(@Param('id') id: string) {
    const data = await this.technicianService.deleteTechnician(id);
    return {
      message: `Technician deleted successfully` };
  }
}
