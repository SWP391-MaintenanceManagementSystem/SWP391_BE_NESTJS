import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { PartDto } from './dto/part.dto';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class PartService {
  constructor(private readonly prisma: PrismaService) {}

  async createPart(createPartDto: CreatePartDto): Promise<PartDto> {
    const newPart = await this.prisma.part.create({
      data: {
        name: createPartDto.name,
        description: createPartDto.description,
        price: createPartDto.price,
        stock: createPartDto.stock,
        minStock: createPartDto.minStock,
        catergoryId: createPartDto.categoryId,
      },
    });
    return plainToInstance(PartDto, newPart, { excludeExtraneousValues: true });
  }

  async getAllParts(): Promise<PartDto[]> {
    const parts = await this.prisma.part.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
    return plainToInstance(PartDto, parts, { excludeExtraneousValues: true });
  }

  async getPartByID(id: string): Promise<PartDto> {
    const part = await this.prisma.part.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!part) {
      throw new NotFoundException(`Part with ID ${id} not found`);
    }

    return plainToInstance(PartDto, part, { excludeExtraneousValues: true });
  }

  async updatePart(id: string, updatePartDto: UpdatePartDto): Promise<PartDto> {
    const existingPart = await this.prisma.part.findUnique({ where: { id } });
    if (!existingPart) {
      throw new NotFoundException(`Part with ID ${id} not found`);
    }

    const { categoryId, ...rest } = updatePartDto;

    const updatedPart = await this.prisma.part.update({
      where: { id },
      data: {
        ...rest,
        ...(categoryId && { category: { connect: { id: categoryId } } }),
      },
      include: { category: true },
    });

    return plainToInstance(PartDto, updatedPart, { excludeExtraneousValues: true });
  }

  async deletePart(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.part.delete({ where: { id } });
      return { message: `Part with ID ${id} has been deleted successfully` };
    } catch (error) {
      if (error.code === 'P2025') {
        // Prisma error code for "Record not found"
        throw new NotFoundException(`Part with ID ${id} not found`);
      }
      throw error; // Re-throw other unexpected errors
    }
  }
}
