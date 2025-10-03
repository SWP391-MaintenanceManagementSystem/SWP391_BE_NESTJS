import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";
import { PackageDto } from "src/modules/package/dto/package.dto";
import { ServiceDto } from "src/modules/service/dto/service.dto";

export class PackageDetailDto {
  @ApiProperty()
  @Exclude()
  packageId: string;

  @ApiProperty()
  @Exclude()
  serviceId: string;

  @ApiProperty({ example: 2 })
  @Expose()
  quantity: number;


  @ApiProperty({ type: () => ServiceDto, required: false })
  @Expose()
  @Type(() => ServiceDto)
  service?: ServiceDto;

}
