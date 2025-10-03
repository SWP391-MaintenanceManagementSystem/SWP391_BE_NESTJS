import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateServiceDto {
   @ApiProperty({
    example: 'Engine Oil Change',
    description: 'Name of the service',
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Complete oil replacement for engine',
    description: 'Detailed description of the service',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 150000,
    description: 'Price of the service (in VND)',
  })
  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: ['partId1', 'partId2'],
    description: 'List of associated part IDs',
  })
  @IsString({ each: true })
  partIds: string[];

}
