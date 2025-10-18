import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateEmployeeWithCenterDTO } from '../../dto/create-employee-with-center.dto';

export class CreateTechnicianDTO {
  @ApiProperty({
    description: 'Technician email',
    example: 'technician@example.com',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @ApiPropertyOptional({ example: '0912345678' })
  phone?: string;

  @ApiProperty({
    description: 'The first name of the technician',
    example: 'John',
  })
  @IsString({ message: 'First name must be a string' })
  firstName: string;

  @ApiProperty({
    description: 'The last name of the technician',
    example: 'Doe',
  })
  @IsString({ message: 'Last name must be a string' })
  lastName: string;

  @ApiPropertyOptional({
    type: CreateEmployeeWithCenterDTO,
    description: 'Work center assignment',
  })
  @IsOptional()
  @Type(() => CreateEmployeeWithCenterDTO)
  workCenter?: CreateEmployeeWithCenterDTO;
}
