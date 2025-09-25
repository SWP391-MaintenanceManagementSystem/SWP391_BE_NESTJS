import { Body, Controller, Get, Query, Param, Delete, Post, Patch } from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { ApiTags, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';

@ApiTags('Technician')
@ApiBearerAuth('jwt-auth')
@Controller('api/technician')
export class TechnicianController {
  constructor(private readonly technicianService: TechnicianService) {}

  // @Get('/')
  // @Roles(AccountRole.ADMIN)
  // @ApiQuery({
  //   name: 'where',
  //   required: false,
  //   type: String,
  //   description: 'JSON string for filter conditions',
  //   example: '{"status":"VERIFIED"}',
  // })
  // @ApiQuery({
  //   name: 'orderBy',
  //   required: false,
  //   type: String,
  //   description: 'JSON string for sorting criteria',
  //   example: '{"createdAt":"desc"}',
  // })
  // @ApiQuery({
  //   name: 'page',
  //   required: false,
  //   type: Number,
  //   description: 'Page number',
  //   example: 1,
  // })
  // @ApiQuery({
  //   name: 'pageSize',
  //   required: false,
  //   type: Number,
  //   description: 'Number of records per page',
  //   example: 10,
  // })

  // async getTechnicians(
  //   @Query('where') where?: string,
  //   @Query('orderBy') orderBy?: string,
  //   @Query('page') page?: string,
  //   @Query('pageSize') pageSize?: string
  // ) {
  //   const {
  //     data,
  //     page: _page,
  //     pageSize: _pageSize,
  //     total,
  //     totalPages,
  //   } = await this.technicianService.getTechnicians({
  //     where: where ? JSON.parse(where) : undefined,
  //     orderBy: orderBy ? JSON.parse(orderBy) : undefined,
  //     page: page ? parseInt(page) : 1,
  //     pageSize: pageSize ? parseInt(pageSize) : 10,
  //   });
  //   return {
  //     message: 'Technicians retrieved successfully',
  //     data,
  //     page: _page,
  //     pageSize: _pageSize,
  //     total,
  //     totalPages,
  //   };
  // }

  @Get('/:id')
  @Roles(AccountRole.ADMIN)
  async getTechnicianById(@Param('id') id: string) {
    const data = await this.technicianService.getTechnicianById(id);
    return { 
      message: `Technician with ID retrieved successfully`, 
      status: 'success',
      data
     };
  }

  @Post()
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: CreateTechnicianDto })
  async createTechnician(@Body() createTechnicianDto: CreateTechnicianDto) {
    const data = await this.technicianService.createTechnician(createTechnicianDto);
    return { 
      message: 'Technician created successfully', 
      status: 'success',
      data
     };
  }

  @Patch('/:id')
  @Roles(AccountRole.ADMIN)
  @ApiBody({ type: UpdateTechnicianDto })
  async updateTechnician(
    @Param('id') id: string,
    @Body() updateTechnicianDto: UpdateTechnicianDto
  ) {
    const technician = await  this.technicianService.updateTechnician(id, updateTechnicianDto);
    return { 
      message: `Technician updated successfully`,
      technician
     };  
  }

  // @Delete('/:id')
  // @Roles(AccountRole.ADMIN)
  // async deleteTechnician(@Param('id') id: string) {
  //   await this.technicianService.deleteTechnician(id);
  //   return { message: `Technician deleted successfully` };
  // }
}
