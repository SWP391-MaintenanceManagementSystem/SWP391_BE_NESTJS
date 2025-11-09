import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { EmployeeQueryDTO } from './dto/employee-query.dto';

@ApiTags('Employees')
@Controller('api/employees')
@UseGuards(RoleGuard)
@ApiBearerAuth('jwt-auth')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('all')
  @Roles(AccountRole.ADMIN, AccountRole.STAFF, AccountRole.TECHNICIAN)
  async getAllEmployees(@Query() query: EmployeeQueryDTO) {
    const data = await this.employeeService.getAllEmployees(query);

    return {
      message: 'All employees retrieved successfully',
      data,
      total: data.length,
    };
  }
}
