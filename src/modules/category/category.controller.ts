import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';

@ApiTags('Category')
@Controller('api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('/')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto);
  }

  @Get()
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  async getAllCategories() {
    const categories = await this.categoryService.getAllCategory();
    return {
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  @Get(':id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  findOne(@Param('id') id: string) {
    return this.categoryService.getCategoryById(id);
  }

  @Get('search/:name')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  findByName(@Param('name') name: string) {
    return this.categoryService.getCategoryByName(name);
  }

  @Patch(':id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.updateCategory(id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles(AccountRole.ADMIN)
  @ApiBearerAuth('jwt-auth')
  remove(@Param('id') id: string) {
    return this.categoryService.removeCategory(id);
  }
}
