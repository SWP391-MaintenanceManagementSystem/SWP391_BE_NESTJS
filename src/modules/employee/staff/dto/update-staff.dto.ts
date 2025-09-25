import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateStaffDto } from './create-staff.dto';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateStaffDto {
    @IsOptional()
    @IsEmail({}, { message: 'Invalid email format' })
    @ApiPropertyOptional({ example: 'staff@example.com' })
    email?: string;

    @IsOptional()
    @IsString({ message: 'First name must be a string' })
    @ApiPropertyOptional({ example: 'John' })
    firstName?: string;

    @IsOptional()
    @IsString({ message: 'Last name must be a string' })
    @ApiPropertyOptional({ example: 'Doe' })
    lastName?: string;

    @IsOptional()
    @IsString({ message: 'Phone must be a string' })
    @Matches(/^[0-9]{10,11}$/, { message: 'Phone must be 10-11 digits' })
    @ApiPropertyOptional({ example: '0912345678' })
    phone?: string;

    @IsOptional()
    @IsString({ message: 'Password must be a string' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain uppercase, lowercase, number and special character'
    })
    @ApiPropertyOptional({ example: 'NewPassword123!' })
    password?: string;
}
