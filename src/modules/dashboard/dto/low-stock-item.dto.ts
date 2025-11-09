import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class LowStockItemDTO {
  @ApiProperty({ example: 'SSD Samsung 512GB' })
  @Expose()
  name: string;

  @ApiProperty({ example: 5 })
  @Expose()
  quantity: number;

  @ApiProperty({ example: 20 })
  @Expose()
  minRequired: number;
}
