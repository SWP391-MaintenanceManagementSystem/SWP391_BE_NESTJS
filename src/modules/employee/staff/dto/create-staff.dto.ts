import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
export class CreateStaffDto {
    @ApiProperty({
        example: 'Nguyen',
        description: 'Họ (first name) của nhân viên',
    })
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @ApiProperty({
        example: 'Van A',
        description: 'Tên (last name) của nhân viên',
    })
    @IsNotEmpty()
    @IsString()
    lastName: string;

    @ApiProperty({
        example: 'vana@example.com',
        description: 'Email dùng để đăng nhập',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'StrongPassword123!',
        description: 'Mật khẩu cho tài khoản',
    })

    @IsNotEmpty()
    @IsString()
    password: string;

    @ApiPropertyOptional({
        example: '+84987654321',
        description: 'Số điện thoại của nhân viên (không bắt buộc)',
    })
    @IsOptional()
    @IsString()
    phone?: string;
}
