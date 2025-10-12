import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { PartDto } from './dto/part.dto';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { PartQueryDto } from './dto/part-query.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
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

  async getAllParts(filter: PartQueryDto): Promise<PaginationResponse<PartDto>> {
  let {
    page = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    orderBy = 'desc',
    name,
    status, // AVAILABLE | OUT_OF_STOCK | DISCONTINUED
  } = filter;

  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = 10;
  if (sortBy === 'quantity') sortBy = 'stock';

  // 🔍 Tìm theo tên part hoặc tên category
  const baseWhere: Prisma.PartWhereInput = name
    ? {
        OR: [
          { name: { contains: name, mode: 'insensitive' } },
          { category: { name: { contains: name, mode: 'insensitive' } } },
        ],
      }
    : {};


  const where: Prisma.PartWhereInput = {
    ...baseWhere,
    ...(status ? { status } : {}),
  };


  const [parts, total] = await this.prisma.$transaction([
    this.prisma.part.findMany({
      where,
      include: {
        category: true,
        ServicePart: true,
      },
      orderBy: ['name', 'price', 'stock', 'createdAt'].includes(sortBy)
        ? { [sortBy]: orderBy }
        : { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    this.prisma.part.count({ where }),
  ]);


  const mappedParts = parts.map((p) => ({
    ...p,
    quantity: p.stock,
  }));

  const paginatedData = plainToInstance(PartDto, mappedParts, {
    excludeExtraneousValues: true,
  });

  return {
    data: paginatedData,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
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

    const { categoryId, status ,...rest } = updatePartDto;

    let newStatus = status ?? existingPart.status;

    if(!status && typeof rest.stock === 'number') {
      newStatus = rest.stock === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE';
    }

    const updatedPart = await this.prisma.part.update({
      where: { id },
      data: {
        ...rest,
        status: newStatus,
        ...(categoryId && { category: { connect: { id: categoryId } } }),
      },
      include: { category: true },
    });

    return plainToInstance(PartDto, updatedPart, { excludeExtraneousValues: true });
  }

  async deletePart(id: string): Promise<{ message: string }> {
    const part = await this.prisma.part.findUnique({ where: { id } });
  if (!part) {
    throw new NotFoundException(`Part with ID ${id} not found`);
  }


  await this.prisma.part.update({
    where: { id },
    data: { status: 'DISCONTINUED' },
  });

  return { message: `Part with ID ${id} has been marked as DISCONTINUED` };
  }

  async getPartStatistics() {
    const totalItems = await this.prisma.part.count();

    const parts = await this.prisma.part.findMany({
      select: { price: true, stock: true },
    });

    const totalValue = parts.reduce((sum, p) => sum + p.price * p.stock, 0);

    const totalQuantity = parts.reduce((sum, p) => sum + p.stock, 0);

    const lowStockItemsRaw = await this.prisma.$queryRawUnsafe<{ count: number }[]>(`
    SELECT COUNT(*)::int AS count FROM "parts" WHERE stock <= "min_stock"
  `);
    const lowStockItems = lowStockItemsRaw[0].count;

    const categories = await this.prisma.category.count();

    return {
      totalItems,
      totalValue,
      totalQuantity,
      lowStockItems,
      categories,
    };
  }
}
