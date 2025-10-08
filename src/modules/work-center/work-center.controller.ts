import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { WorkCenterService } from './work-center.service';
import { CreateWorkCenterDto } from './dto/create-work-center.dto';
import { UpdateWorkCenterDto } from './dto/update-work-center.dto';
import { WorkCenterQueryDto } from './dto/work-center-query.dto';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { AccountRole } from '@prisma/client';

@ApiTags('Work Center')
@Controller('api/work-center')
@UseGuards(RoleGuard)
@ApiBearerAuth('jwt-auth')
export class WorkCenterController {
  constructor(private readonly workCenterService: WorkCenterService) {}

  @Post()
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: CreateWorkCenterDto })
  async createWorkCenter(
    @Body() createWorkCenterDto: CreateWorkCenterDto,
    @CurrentUser() user: any
  ) {
    const data = await this.workCenterService.createWorkCenter(createWorkCenterDto, user.role);
    return {
      message: 'Work center assignment created successfully',
      data,
    };
  }

  @Get()
  @Roles(AccountRole.ADMIN, AccountRole.STAFF, AccountRole.TECHNICIAN)
  async getWorkCenters(@Query() query: WorkCenterQueryDto, @CurrentUser() user: any) {
    const { data, page, pageSize, total, totalPages } = await this.workCenterService.getWorkCenters(
      query,
      user.role,
      user.sub
    );
    return {
      message: 'Work center assignments retrieved successfully',
      data,
      pagination: { page, pageSize, total, totalPages },
    };
  }

  @Get(':id')
  @Roles(AccountRole.ADMIN, AccountRole.STAFF, AccountRole.TECHNICIAN)
  async getWorkCenterById(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.workCenterService.getWorkCenterById(id, user.role, user.sub);
    return {
      message: 'Work center assignment retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(AccountRole.ADMIN)
  async updateWorkCenter(
    @Param('id') id: string,
    @Body() updateWorkCenterDto: UpdateWorkCenterDto
  ) {
    const data = await this.workCenterService.updateWorkCenter(id, updateWorkCenterDto);
    return {
      message: 'Work center assignment updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(AccountRole.ADMIN)
  async deleteWorkCenter(@Param('id') id: string) {
    const data = await this.workCenterService.deleteWorkCenter(id);
    return {
      message: 'Work center assignment deleted successfully',
      data,
    };
  }
}
