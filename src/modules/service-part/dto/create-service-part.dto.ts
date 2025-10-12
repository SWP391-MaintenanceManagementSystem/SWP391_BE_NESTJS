import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateServicePartDto {
  @ApiProperty({ description: 'Service ID', example: 'uuid-service-id' })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ description: 'Part ID', example: 'uuid-part-id' })
  @IsUUID()
  @IsNotEmpty()
  partId: string;

  @ApiProperty({ description: 'Quantity of the part used', example: 2 })
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
