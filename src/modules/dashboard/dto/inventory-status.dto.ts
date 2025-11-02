import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { LowStockItemDTO } from './low-stock-item.dto';

export class InventoryStatusDTO {
  @ApiProperty({ example: 100 })
  @Expose()
  inStock: number;

  @ApiProperty({ example: 5 })
  @Expose()
  lowStock: number;

  @ApiProperty({ example: 10 })
  @Expose()
  disStock: number;

  @ApiProperty({ example: 115 })
  @Expose()
  totalItems: number;

  @ApiProperty({ example: 111110 })
  @Expose()
  totalValue: number;

  @ApiProperty({ type: [LowStockItemDTO] })
  @Expose()
  @Type(() => LowStockItemDTO)
  lowStockItems: LowStockItemDTO[];
}
