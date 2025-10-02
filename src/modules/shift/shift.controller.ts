import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ShiftService } from './shift.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { ShiftQueryDTO } from './dto/shift-query.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { AccountRole } from '@prisma/client';

@ApiTags('Shift')
@Controller('api/shift')
@ApiBearerAuth('jwt-auth')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: CreateShiftDto })
  async createShift(@Body() createShiftDto: CreateShiftDto) {
    const data = await this.shiftService.createShift(createShiftDto);
    return {
      message: 'Shift created successfully',
      data,
    };
  }

  @Get()
  @Roles(AccountRole.ADMIN, AccountRole.STAFF, AccountRole.TECHNICIAN)
  async getShifts(
    @Query() query: ShiftQueryDTO,
    @CurrentUser() user: any
  ) {
    const {
      data,
      page,
      pageSize,
      total,
      totalPages,
    } = await this.shiftService.getShifts(query, user.role, user.sub);

    return {
      message: 'Shifts retrieved successfully',
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  @Get(':id')
  @Roles(AccountRole.ADMIN, AccountRole.STAFF, AccountRole.TECHNICIAN)
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Shift UUID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  async getShiftById(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    const data = await this.shiftService.getShiftById(id, user.role, user.sub);
    return {
      message: `Shift with ID ${id} retrieved successfully`,
      data,
    };
  }

  @Patch(':id')
  @Roles(AccountRole.ADMIN)
  @ApiParam({ name: 'id', type: String, description: 'Shift UUID' })
  @ApiBody({ type: UpdateShiftDto })
  async updateShift(
    @Param('id') id: string,
    @Body() updateShiftDto: UpdateShiftDto
  ) {
    const data = await this.shiftService.updateShift(id, updateShiftDto);
    return {
      message: 'Shift updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(AccountRole.ADMIN)
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Shift UUID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
  })
  async deleteShift(
    @Param('id') id: string,
  ) {
    const data = await this.shiftService.deleteShift(id);
    return {
      message: 'Shift deleted successfully',
      data,
    }
  }

  // Get available shifts (có slot trống)

  // @Get('available/slots')
  // @Roles(AccountRole.ADMIN, AccountRole.STAFF)
  // @ApiQuery({ name: 'centerId', required: false, type: String })
  // async getAvailableShifts(
  //   @Query('centerId') centerId?: string
  // ) {
  //   // Implement this method in service if needed
  //   return {
  //     message: 'Available shifts retrieved successfully',
  //     data: [], // Implementation needed in service
  //   };
  // }

  // Get assigned shifts (cho TECHNICIAN)

  // @Get('assigned/me')
  // @Roles(AccountRole.TECHNICIAN)
  // @ApiOperation({ summary: 'Get my assigned shifts (Technician only)' })
  // @ApiResponse({ status: 200, description: 'Assigned shifts retrieved successfully' })
  // async getMyAssignedShifts(@CurrentUser() user: any) {
  //   // Implement this method in service if needed
  //   return {
  //     message: 'Your assigned shifts retrieved successfully',
  //     data: [], // Implementation needed in service
  //   };
  // }
}
