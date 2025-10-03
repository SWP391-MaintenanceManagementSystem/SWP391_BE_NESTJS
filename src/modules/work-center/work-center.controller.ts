import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkCenterService } from './work-center.service';
import { CreateWorkCenterDto } from './dto/create-work-center.dto';
import { UpdateWorkCenterDto } from './dto/update-work-center.dto';

@Controller('work-center')
export class WorkCenterController {
  constructor(private readonly workCenterService: WorkCenterService) {}

  @Post()
  create(@Body() createWorkCenterDto: CreateWorkCenterDto) {
    return this.workCenterService.create(createWorkCenterDto);
  }

  @Get()
  findAll() {
    return this.workCenterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workCenterService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkCenterDto: UpdateWorkCenterDto) {
    return this.workCenterService.update(+id, updateWorkCenterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workCenterService.remove(+id);
  }
}
