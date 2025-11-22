import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PartDto } from 'src/modules/part/dto/part.dto';
import { ServiceDto } from 'src/modules/service/dto/service.dto';

export default class ServicePartDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  quantity: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty({ type: () => ServiceDto })
  @Expose()
  @Type(() => ServiceDto)
  service: ServiceDto;

  @ApiProperty({ type: () => PartDto })
  @Expose()
  @Type(() => PartDto)
  part: PartDto;
}
