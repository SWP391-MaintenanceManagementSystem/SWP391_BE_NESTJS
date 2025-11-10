import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { PartService } from './part.service';
import { CreatePartDto } from './dto/create-part.dto';
import { RefillPartDto, UpdatePartDto } from './dto/update-part.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { PartQueryDto } from './dto/part-query.dto';
import { PartDto } from './dto/part.dto';
import { plainToInstance } from 'class-transformer';
import { EmitNotification } from 'src/common/decorator/emit-notification.decorator';
import { NotificationTemplateService } from '../notification/notification-template.service';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { JWT_Payload } from 'src/common/types';
import { RefillRequestService } from './refill-request.service';

@ApiTags('Part')
@Controller('api/parts')
export class PartController {
  constructor(
    private readonly partService: PartService,
    private readonly refillRequestService: RefillRequestService
  ) {}

  @Post('/')
  @Roles(AccountRole.ADMIN, AccountRole.TECHNICIAN)
  @ApiBearerAuth('jwt-auth')
  create(@Body() createPartDto: CreatePartDto) {
    return this.partService.createPart(createPartDto);
  }

  @Get('/')
  @Roles(AccountRole.ADMIN, AccountRole.TECHNICIAN)
  @ApiBearerAuth('jwt-auth')
  async getAllParts(@Query() query: PartQueryDto) {
    const { data, page, pageSize, total, totalPages } = await this.partService.getAllParts(query);

    const parts = data.map(part => plainToInstance(PartDto, part));

    return {
      message: 'Parts retrieved successfully',
      data: parts,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  @Get('statistics')
  @Roles(AccountRole.ADMIN, AccountRole.TECHNICIAN)
  @ApiBearerAuth('jwt-auth')
  async getStatistics() {
    const stats = await this.partService.getPartStatistics();
    return {
      message: 'Part statistics retrieved successfully',
      data: stats,
    };
  }

  @Get(':id')
  @Roles(AccountRole.ADMIN, AccountRole.TECHNICIAN)
  @ApiBearerAuth('jwt-auth')
  findOne(@Param('id') id: string) {
    return this.partService.getPartByID(id);
  }

  @Patch(':id')
  @Roles(AccountRole.ADMIN, AccountRole.TECHNICIAN)
  @ApiBearerAuth('jwt-auth')
  update(@Param('id') id: string, @Body() updatePartDto: UpdatePartDto) {
    return this.partService.updatePartInfo(id, updatePartDto);
  }

  @Patch(':id/refill')
  @Roles(AccountRole.ADMIN, AccountRole.TECHNICIAN)
  @ApiBearerAuth('jwt-auth')
  refill(@Param('id') id: string, @Body() dto: RefillPartDto) {
    return this.partService.refillOutOfStockPart(id, dto.refillAmount);
  }

  @Delete(':id')
  @Roles(AccountRole.ADMIN, AccountRole.TECHNICIAN)
  @ApiBearerAuth('jwt-auth')
  remove(@Param('id') id: string) {
    return this.partService.deletePart(id);
  }

  // Technician requests refill for out-of-stock part
  @Post(':id/request-refill')
  @Roles(AccountRole.TECHNICIAN)
  @EmitNotification(NotificationTemplateService.partRefillRequested())
  @ApiBearerAuth('jwt-auth')
  async requestRefill(
    @Param('id') partId: string,
    @Body() dto: RefillPartDto,
    @CurrentUser() user: JWT_Payload
  ) {
    //fetches technician info from database
    const result = await this.partService.requestPartRefill(partId, dto.refillAmount, user.sub);

    return {
      part: result.part,
      adminIds: result.adminIds,
      technician: result.technician,
      refillAmount: dto.refillAmount,
      message: 'Refill request sent to admins successfully.',
    };
  }

  // Admin approves refill request
  @Patch(':id/approve-refill')
  @Roles(AccountRole.ADMIN)
  @EmitNotification(NotificationTemplateService.partRefillApproved())
  @ApiBearerAuth('jwt-auth')
  async approveRefill(@Param('id') partId: string) {
    const request = this.refillRequestService.getAndRemove(partId);

    if (!request) {
      throw new BadRequestException('No refill request found for this part.');
    }

    const updatedPart = await this.partService.refillOutOfStockPart(partId, request.refillAmount);

    return {
      part: updatedPart,
      refillAmount: request.refillAmount,
      newStock: updatedPart.quantity,
      technicianId: request.technicianId,
      message: 'Part refilled successfully. Technician has been notified.',
    };
  }
}
