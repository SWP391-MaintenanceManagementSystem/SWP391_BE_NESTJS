import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryDto } from './dto/category.dto';
import { PrismaService } from '../prisma/prisma.service';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
    const existingCategory = await this.prisma.category.findFirst({
    where: { name: {
      equals: createCategoryDto.name,
      mode: 'insensitive'
    } },
  });

  if (existingCategory) {
    throw new BadRequestException(
      `Category with name ${createCategoryDto.name} already exists`
    );
  }

  const category = await this.prisma.category.create({
    data: createCategoryDto,
  });

  return plainToInstance(CategoryDto, category);
  }

  async getAllCategory(): Promise<CategoryDto[]> {
    const categories =  await this.prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return plainToInstance(CategoryDto, categories, { excludeExtraneousValues: true });
  }

  async getCategoryByName(name: string): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
      },
      include: { parts: true },
    });
    if (!categories || categories.length === 0) {
      throw new NotFoundException(`Category with Name ${name} not found`);
    }
    return plainToInstance(CategoryDto, categories, { excludeExtraneousValues: true });
  }

  async getCategoryById(id: string): Promise<CategoryDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { parts: true },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return plainToInstance(CategoryDto, category, { excludeExtraneousValues: true });
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto> {
    const category = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
    return plainToInstance(CategoryDto, category);
  }

  async removeCategory(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    await this.prisma.category.delete({ where: { id } });
  }
}
