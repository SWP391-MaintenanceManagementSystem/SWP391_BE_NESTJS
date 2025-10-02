import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreatePackageDto {
  @ApiProperty({ example: 'Basic Maintenance Package' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 1200000 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;
}
