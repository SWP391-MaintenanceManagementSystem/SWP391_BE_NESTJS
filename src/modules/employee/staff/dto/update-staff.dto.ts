import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { UpdateEmployeeWithCenterDTO } from '../../dto/update-employee-with-center.dto';

export class UpdateStaffDTO {
  @IsOptional()
  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: '0912345678' })
  phone?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'VERIFIED', enum: AccountStatus })
  status?: AccountStatus;

  @ApiPropertyOptional({ type: UpdateEmployeeWithCenterDTO, description: 'Work center assignment' })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateEmployeeWithCenterDTO)
  workCenter?: UpdateEmployeeWithCenterDTO;
}
