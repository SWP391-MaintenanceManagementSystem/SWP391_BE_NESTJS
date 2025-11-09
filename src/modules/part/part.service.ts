import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { PartDto } from './dto/part.dto';
import { PartStatus, Prisma, AccountRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { PartQueryDto } from './dto/part-query.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
@Injectable()
export class PartService {
  constructor(private readonly prisma: PrismaService) {}

  async createPart(createPartDto: CreatePartDto): Promise<PartDto> {
    const { name, categoryId, price, stock, minStock, description } = createPartDto;

    const errors: Record<string, string> = {};

    if (!name || name.trim() === '') errors.name = 'Item name is required';
    if (!categoryId || categoryId.trim() === '') errors.categoryId = 'Category is required';
    if (price == null || price < 1) errors.price = 'Price must be at least 1';
    if (stock == null || stock < 1) errors.stock = 'Quantity must be at least 1';
    if (minStock == null || minStock < 1) errors.minStock = 'Minimum Stock must be at least 1';

    if (name && categoryId) {
      const existingPart = await this.prisma.part.findFirst({
        where: { name, categoryId },
        include: { category: true },
      });

      if (existingPart) {
        if (existingPart.status === 'DISCONTINUED') {
          throw new BadRequestException({
            message: `Part ${name} already existed in category ${existingPart.category.name} but is discontinued. You may recover it.`,
          });
        } else {
          errors.name = `Part ${name} already exists in category ${existingPart.category.name}.`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ errors });
    }

    const computedStatus = stock <= minStock ? PartStatus.OUT_OF_STOCK : PartStatus.AVAILABLE;

    const newPart = await this.prisma.part.create({
      data: {
        name,
        category: { connect: { id: categoryId } },
        price,
        stock,
        minStock,
        description,
        status: computedStatus,
      },
      include: { category: true },
    });

    return plainToInstance(
      PartDto,
      { ...newPart, quantity: newPart.stock },
      { excludeExtraneousValues: true }
    );
  }

  async getAllParts(filter: PartQueryDto): Promise<PaginationResponse<PartDto>> {
    let {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      orderBy = 'asc',
      name,
      categoryName,
      status,
    } = filter;

    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 10;
    if (sortBy === 'quantity') sortBy = 'stock';

    if (categoryName) {
      try {
        categoryName = decodeURIComponent(categoryName.replace(/\+/g, ' ')).trim();
      } catch {
        categoryName = categoryName.replace(/\+/g, ' ').trim();
      }
    }

    const statusFilter: Prisma.PartWhereInput = status
      ? { status }
      : {
          status: {
            in: [PartStatus.AVAILABLE, PartStatus.OUT_OF_STOCK, PartStatus.DISCONTINUED],
          },
        };

    const whereClauses: Prisma.PartWhereInput[] = [];

    if (name) {
      whereClauses.push({
        OR: [
          { name: { contains: name, mode: 'insensitive' } },
          { category: { name: { contains: name, mode: 'insensitive' } } },
        ],
      });
    }

    if (categoryName) {
      whereClauses.push({
        category: { name: { equals: categoryName, mode: 'insensitive' } },
      });
    }

    const baseWhere: Prisma.PartWhereInput = {
      AND: [...whereClauses, statusFilter] as any,
    };

    const orderByArray: Prisma.Enumerable<Prisma.PartOrderByWithRelationInput> = [];

    if (['name', 'price', 'stock', 'createdAt'].includes(sortBy)) {
      orderByArray.push({ [sortBy]: orderBy });
    } else {
      orderByArray.push({ createdAt: 'asc' });
    }

    orderByArray.push({ createdAt: 'asc' });
    orderByArray.push({ id: 'asc' });

    const [parts, total] = await this.prisma.$transaction([
      this.prisma.part.findMany({
        where: baseWhere,
        include: {
          category: true,
          ServicePart: true,
        },
        orderBy: orderByArray,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.part.count({ where: baseWhere }),
    ]);

    const mappedParts = parts.map(p => ({
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

  async updatePartInfo(id: string, updatePartDto: UpdatePartDto): Promise<PartDto> {
    const existingPart = await this.prisma.part.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!existingPart) {
      throw new NotFoundException(`Part with ID ${id} not found`);
    }

    const { name, categoryId, price, stock, minStock, description, status } = updatePartDto;
    const errors: Record<string, string> = {};

    if (name !== undefined && name.trim() === '') errors.name = 'Item name is required';
    if (categoryId !== undefined && categoryId.trim() === '')
      errors.categoryId = 'Category is required';
    if (price !== undefined && price < 1) errors.price = 'Price must be at least 1';
    if (stock !== undefined && stock < 1) errors.stock = 'Quantity must be at least 1';
    if (minStock !== undefined && minStock < 1)
      errors.minStock = 'Minimum Stock must be at least 1';

    if (
      (name && name !== existingPart.name) ||
      (categoryId && categoryId !== existingPart.categoryId)
    ) {
      const duplicate = await this.prisma.part.findFirst({
        where: {
          name: name ?? existingPart.name,
          categoryId: categoryId ?? existingPart.categoryId,
          NOT: { id },
        },
        include: { category: true },
      });

      if (duplicate) {
        if (duplicate.status === 'DISCONTINUED') {
          throw new BadRequestException({
            message: `Part ${duplicate.name} already existed in category ${duplicate.category.name} but is discontinued. You may recover this part.`,
          });
        } else {
          errors.name = `Part ${duplicate.name} already exists in category ${duplicate.category.name}.`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ errors });
    }

    const newStock = stock ?? existingPart.stock;
    const newMinStock = minStock ?? existingPart.minStock;
    let newStatus = existingPart.status;

    if (existingPart.status === 'DISCONTINUED') {
      if (status === 'AVAILABLE') {
        if (newStock < newMinStock) {
          throw new BadRequestException({
            message: `Cannot set status to AVAILABLE because Quantity < Minimum Stock.`,
          });
        }
        newStatus = 'AVAILABLE';
      } else {
        throw new BadRequestException({
          message: `This part is currently discontinued. Reactivate it (set to Available) to edit.`,
        });
      }
    } else {
      newStatus = newStock <= newMinStock ? 'OUT_OF_STOCK' : 'AVAILABLE';
    }

    const updatedPart = await this.prisma.part.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(stock !== undefined && { stock }),
        ...(minStock !== undefined && { minStock }),
        ...(categoryId !== undefined && { category: { connect: { id: categoryId } } }),
        status: newStatus,
      },
      include: { category: true },
    });

    return plainToInstance(
      PartDto,
      { ...updatedPart, quantity: updatedPart.stock },
      { excludeExtraneousValues: true }
    );
  }

  async refillOutOfStockPart(id: string, refillAmount: number): Promise<PartDto> {
    if (refillAmount <= 0) {
      throw new BadRequestException(`Refill amount must be greater than 0.`);
    }

    const part = await this.prisma.part.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!part) {
      throw new NotFoundException(`Part with ID ${id} not found`);
    }

    if (part.status !== 'OUT_OF_STOCK') {
      throw new BadRequestException(
        `Cannot refill part with status ${part.status}. Only parts that are OUT_OF_STOCK can be refilled.`
      );
    }

    const newStock = part.stock + refillAmount;

    const newStatus = newStock > part.minStock ? 'AVAILABLE' : 'OUT_OF_STOCK';

    const updatedPart = await this.prisma.part.update({
      where: { id },
      data: {
        stock: newStock,
        status: newStatus,
      },
      include: { category: true },
    });

    return plainToInstance(
      PartDto,
      { ...updatedPart, quantity: updatedPart.stock },
      { excludeExtraneousValues: true }
    );
  }

  async requestPartRefill(
    partId: string,
    refillAmount: number,
    technicianId: string
  ): Promise<{
    part: PartDto;
    adminIds: string[];
    technician: { id: string; firstName: string; lastName: string; email: string };
  }> {
    // 1. Validate refill amount
    if (refillAmount <= 0) {
      throw new BadRequestException('Refill amount must be greater than 0');
    }

    // 2. Get part info
    const part = await this.prisma.part.findUnique({
      where: { id: partId },
      include: { category: true },
    });

    if (!part) {
      throw new NotFoundException(`Part with ID ${partId} not found`);
    }

    // 3. Check if part is OUT_OF_STOCK
    if (part.status !== PartStatus.OUT_OF_STOCK) {
      throw new BadRequestException(
        `Part "${part.name}" is currently ${part.status}. Only OUT_OF_STOCK parts can request refill.`
      );
    }

    // 4. ✅ FIX: Get technician info from Account
    const account = await this.prisma.account.findUnique({
      where: { id: technicianId },
      select: {
        id: true,
        email: true,
        role: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.role !== AccountRole.TECHNICIAN) {
      throw new BadRequestException('Only technicians can request part refill');
    }

    if (!account.employee) {
      throw new NotFoundException('Technician profile not found');
    }

    // 5. Get all VERIFIED ADMIN accounts
    const admins = await this.prisma.account.findMany({
      where: {
        role: AccountRole.ADMIN,
        status: 'VERIFIED',
      },
      select: { id: true },
    });

    const adminIds = admins.map(admin => admin.id);

    if (adminIds.length === 0) {
      throw new BadRequestException('No admins available to process refill request');
    }

    const partDto = plainToInstance(
      PartDto,
      { ...part, quantity: part.stock },
      { excludeExtraneousValues: true }
    );

    return {
      part: partDto,
      adminIds,
      technician: {
        id: account.id,
        firstName: account.employee.firstName || 'Unknown',
        lastName: account.employee.lastName || '',
        email: account.email,
      },
    };
  }

  async deletePart(id: string): Promise<{ message: string }> {
    const part = await this.prisma.part.findUnique({ where: { id } });
    if (!part) {
      throw new NotFoundException(`Part with ID ${id} not found`);
    }

    if (part.status === 'DISCONTINUED') {
      throw new BadRequestException('It has been discontinued and cannot be deleted.');
    }

    await this.prisma.part.update({
      where: { id },
      data: { status: 'DISCONTINUED', stock: 0, price: 0, minStock: 0 },
    });

    return { message: `Part with ID ${id} has been marked as DISCONTINUED` };
  }

  async getPartStatistics() {
    const activeWhere = { status: { in: [PartStatus.AVAILABLE, PartStatus.OUT_OF_STOCK] } };

    const [totalItems, parts, categories] = await this.prisma.$transaction([
      this.prisma.part.count({ where: activeWhere }),
      this.prisma.part.findMany({
        where: activeWhere,
        select: { price: true, stock: true, minStock: true },
      }),
      this.prisma.category.count(),
    ]);

    const totalValue = parts.reduce((sum, p) => sum + p.price * p.stock, 0);
    const totalQuantity = parts.reduce((sum, p) => sum + p.stock, 0);

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
