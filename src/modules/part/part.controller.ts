import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PartService } from './part.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { PartQueryDto } from './dto/part-query.dto';
import { PartDto } from './dto/part.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Part')
@Controller('api/part')
export class PartController {
  constructor(private readonly partService: PartService) {}

  @Post('/')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  create(@Body() createPartDto: CreatePartDto) {
    return this.partService.createPart(createPartDto);
  }

  @Get('/')
  @Roles(AccountRole.ADMIN)
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
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async getStatistics() {
    const stats = await this.partService.getPartStatistics();
    return {
      message: 'Part statistics retrieved successfully',
      data: stats,
    };
  }


  @Get(':id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  findOne(@Param('id') id: string) {
    return this.partService.getPartByID(id);
  }

  @Patch(':id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  update(@Param('id') id: string, @Body() updatePartDto: UpdatePartDto) {
    return this.partService.updatePart(id, updatePartDto);
  }

  @Delete(':id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  remove(@Param('id') id: string) {
    return this.partService.deletePart(id);
  }
}
