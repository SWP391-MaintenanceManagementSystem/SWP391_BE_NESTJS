import { PartialType } from '@nestjs/swagger';
import { CreateStaffDto } from './create-staff.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateStaffDto extends PartialType(CreateStaffDto) {
    @IsOptional()
    @IsString()
    @ApiProperty({ example: 'John' })
    firstName: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ example: 'Doe' })
    lastName: string;
}
