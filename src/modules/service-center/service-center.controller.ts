import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ServiceCenterService } from './service-center.service';
import { CreateServiceCenterDto } from './dto/create-service-center.dto';
import { UpdateServiceCenterDto } from './dto/update-service-center.dto';
import { ServiceCenterQueryDTO } from './dto/service-center.query.dto';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AccountRole } from '@prisma/client';
import { Roles } from 'src/common/decorator/role.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { ServiceCenterDto } from './dto/service-center.dto';

@ApiTags('Service Center')
@ApiBearerAuth('jwt-auth')
@Controller('api/service-center')
export class ServiceCenterController {
  constructor(private readonly serviceCenterService: ServiceCenterService) {}

  @Post()
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: CreateServiceCenterDto })
  async createServiceCenter(@Body() createServiceCenterDto: CreateServiceCenterDto) {
    const data = await this.serviceCenterService.createServiceCenter(createServiceCenterDto);
    return { data, message: 'Service center created successfully' };
  }

  @Get('/')
  @Roles(AccountRole.ADMIN)
  async getServiceCenters(@Query() query: ServiceCenterQueryDTO) {
    const { data } = await this.serviceCenterService.getServiceCenters(query);

    return {
      message: 'Service centers retrieved successfully',
      data,
    };
  }

  @Get('/:id')
  @Roles(AccountRole.ADMIN, AccountRole.STAFF, AccountRole.TECHNICIAN)
  async getServiceCenterById(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; role: AccountRole; centerId?: string }
  ): Promise<{
    message: string;
    data: ServiceCenterDto;
  }> {
    // Authorization check for non-admin users
    if (user.role !== AccountRole.ADMIN && user.centerId !== id) {
      throw new ForbiddenException('You can only access your assigned service center');
    }

    const data = await this.serviceCenterService.getServiceCenterById(id);
    return {
      message: 'Service center retrieved successfully',
      data,
    };
  }

  @Patch('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: UpdateServiceCenterDto })
  async updateServiceCenter(
    @Param('id') id: string,
    @Body() updateServiceCenterDto: UpdateServiceCenterDto
  ) {
    const data = await this.serviceCenterService.updateServiceCenter(id, updateServiceCenterDto);
    return {
      message: 'Service center updated successfully',
      data,
    };
  }

  @Delete('/:id')
  @Roles(AccountRole.ADMIN)
  async deleteServiceCenter(@Param('id') id: string) {
    await this.serviceCenterService.deleteServiceCenter(id);
    return {
      message: 'Service center closed successfully',
    };
  }
}
