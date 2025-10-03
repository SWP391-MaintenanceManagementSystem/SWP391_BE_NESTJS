import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsUUID, Min } from "class-validator";

export class CreatePackageDetailDto {
  @ApiProperty({ example: 'uuid-package-id' })
  @IsNotEmpty()
  @IsUUID()
  packageId: string;

  @ApiProperty({ example: 'uuid-service-id' })
  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}
