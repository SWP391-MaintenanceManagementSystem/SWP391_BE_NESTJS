import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewDTO } from './dto/dashboard-overview.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('api/dashboards')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

   @Get()
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiQuery({
    name: 'range',
    required: false,
    example: '1w',
  })
  async getDashboardOverview(
    @Query('range') range?: '1d' | '3d' | '1w' | '1m' | '3m',
  ): Promise<DashboardOverviewDTO> {
    return this.dashboardService.getDashboardOverview(range);
  }
}
