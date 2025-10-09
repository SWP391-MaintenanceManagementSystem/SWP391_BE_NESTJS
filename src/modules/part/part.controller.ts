import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PartService } from './part.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';

@ApiTags('Part')
@Controller('part')
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
  findAll() {
    return this.partService.getAllParts();
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
