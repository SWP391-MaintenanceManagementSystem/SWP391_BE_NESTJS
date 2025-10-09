import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ShiftService } from './shift.service';
import { CreateShiftDTO } from './dto/create-shift.dto';
import { UpdateShiftDTO } from './dto/update-shift.dto';
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
  @ApiBody({ type: CreateShiftDTO })
  async createShift(@Body() createShiftDto: CreateShiftDTO) {
    const data = await this.shiftService.createShift(createShiftDto);
    return {
      message: 'Shift created successfully',
      data,
    };
  }

  @Get()
  @Roles(AccountRole.ADMIN)
  async getShifts(@Query() query: ShiftQueryDTO) {
    const { data, page, pageSize, total, totalPages } = await this.shiftService.getShifts(query);

    return {
      message: 'Shifts retrieved successfully',
      data,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  @Get(':id')
  @Roles(AccountRole.ADMIN)
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Shift UUID',
  })
  async getShiftById(@Param('id') id: string) {
    const data = await this.shiftService.getShiftById(id);
    return {
      message: `Shift retrieved successfully`,
      data,
    };
  }

  @Patch(':id')
  @Roles(AccountRole.ADMIN)
  @ApiParam({ name: 'id', type: String, description: 'Shift UUID' })
  @ApiBody({ type: UpdateShiftDTO })
  async updateShift(@Param('id') id: string, @Body() updateShiftDto: UpdateShiftDTO) {
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
  })
  async deleteShift(@Param('id') id: string) {
    const data = await this.shiftService.deleteShift(id);
    return {
      message: 'Shift deleted successfully',
      data,
    };
  }
}
