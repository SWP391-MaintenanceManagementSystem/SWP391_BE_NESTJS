import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { PartDto } from './dto/part.dto';
import { PartStatus, Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { PartQueryDto } from './dto/part-query.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
@Injectable()
export class PartService {
  constructor(private readonly prisma: PrismaService) {}

 async createPart(createPartDto: CreatePartDto): Promise<PartDto> {
    const existingPart = await this.prisma.part.findFirst({
      where: {
        name: createPartDto.name,
        catergoryId: createPartDto.categoryId,
        status: { not: 'DISCONTINUED' },
      },
    });

    if (existingPart) {
      throw new BadRequestException(
        `Part with name "${createPartDto.name}" already exists in this category`
      );
    }


    const newPart = await this.prisma.part.create({
      data: {
        name: createPartDto.name,
        description: createPartDto.description,
        price: createPartDto.price,
        stock: createPartDto.stock,
        minStock: createPartDto.minStock,
        status:
          createPartDto.stock === 0 || createPartDto.stock < createPartDto.minStock
            ? 'OUT_OF_STOCK'
            : 'AVAILABLE',
        catergoryId: createPartDto.categoryId,
      },
    });


    const partWithQuantity = { ...newPart, quantity: newPart.stock };

    return plainToInstance(PartDto, partWithQuantity, { excludeExtraneousValues: true });
  }

  async getAllParts(filter: PartQueryDto): Promise<PaginationResponse<PartDto>> {
  let {
    page = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    orderBy = 'desc',
    name,
    categoryName,
    status, // AVAILABLE | OUT_OF_STOCK
  } = filter;

  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = 10;
  if (sortBy === 'quantity') sortBy = 'stock';


  const statusFilter: Prisma.PartWhereInput = status
    ? { status }
    : { status: { in: [PartStatus.AVAILABLE, PartStatus.OUT_OF_STOCK] } };


  const baseWhere: Prisma.PartWhereInput = {
    AND: [
      name
        ? {
            OR: [
              { name: { contains: name, mode: 'insensitive' } },
              { category: { name: { contains: name, mode: 'insensitive' } } },
            ],
          }
        : {},
      categoryName
        ? { category: { name: { contains: categoryName, mode: 'insensitive' } } }
        : {},
      statusFilter,
    ],
  };

  const [parts, total] = await this.prisma.$transaction([
    this.prisma.part.findMany({
      where: baseWhere,
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
    this.prisma.part.count({ where: baseWhere }),
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
      newStatus = rest.stock === 0 || rest.stock < existingPart.minStock ? 'OUT_OF_STOCK' : 'AVAILABLE';
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

    const partWithQuantity = {
    ...updatedPart,
    quantity: updatedPart.stock,
  };

    return plainToInstance(PartDto, partWithQuantity, { excludeExtraneousValues: true });
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
    // Lọc chỉ các part còn hoạt động (AVAILABLE + OUT_OF_STOCK)
    const activeWhere = { status: { in: [PartStatus.AVAILABLE, PartStatus.OUT_OF_STOCK] } };

    // Lấy tổng số items và thông tin price/stock
    const [totalItems, parts, categories] = await this.prisma.$transaction([
      this.prisma.part.count({ where: activeWhere }),
      this.prisma.part.findMany({
        where: activeWhere,
        select: { price: true, stock: true, minStock: true },
      }),
      this.prisma.category.count(),
    ]);

    // Tổng giá trị và tổng số lượng
    const totalValue = parts.reduce((sum, p) => sum + p.price * p.stock, 0);
    const totalQuantity = parts.reduce((sum, p) => sum + p.stock, 0);

    // Tính lowStock: stock < minStock
    const lowStockItems = parts.filter(p => p.stock < p.minStock).length;

    return {
      totalItems,
      totalValue,
      totalQuantity,
      lowStockItems,
      categories,
    };
  }


}
