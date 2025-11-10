import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateEmployeeWithCenterDTO } from '../../dto/update-employee-with-center.dto';

export class CreateStaffDTO {
  @ApiProperty({
    example: 'staffexample@example.com',
    description: 'Email used for login',
  })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @ApiPropertyOptional({ example: '0912345678' })
  phone?: string;

  @ApiProperty({
    example: 'Staff',
    description: 'First name of the staff',
  })
  @IsString({ message: 'firstName must be a string' })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the staff',
  })
  @IsString({ message: 'lastName must be a string' })
  lastName: string;

  @ApiPropertyOptional({
    type: UpdateEmployeeWithCenterDTO,
    description: 'Work center assignment',
  })
  @IsOptional()
  @Type(() => UpdateEmployeeWithCenterDTO)
  workCenter?: UpdateEmployeeWithCenterDTO;
}
