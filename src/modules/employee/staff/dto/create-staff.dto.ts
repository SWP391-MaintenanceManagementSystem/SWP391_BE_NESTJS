import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
export class CreateStaffDto {
    @ApiProperty({
        example: 'Nguyen',
        description: 'Họ (first name) của nhân viên',
    })
    @IsNotEmpty({ message: 'First name không được để trống' })
    @IsString({ message: 'First name phải là chuỗi ký tự' })
    @Matches(/^[A-Za-zÀ-ỹ\s]+$/, {
        message: 'First name chỉ được chứa chữ cái và khoảng trắng',
    })
    firstName: string;

    @ApiProperty({
        example: 'Van A',
        description: 'Tên (last name) của nhân viên',
    })
    @IsNotEmpty({ message: 'Last name không được để trống' })
    @IsString({ message: 'Last name phải là chuỗi ký tự' })
    @Matches(/^[A-Za-zÀ-ỹ\s]+$/, {
        message: 'Last name chỉ được chứa chữ cái và khoảng trắng',
    })
    lastName: string;

    @ApiProperty({
        example: 'vana@example.com',
        description: 'Email dùng để đăng nhập',
    })
    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsEmail({}, { message: 'Email không đúng định dạng' })
    email: string;

    @ApiProperty({
        example: 'StrongPassword123!',
        description: 'Mật khẩu cho tài khoản',
    })
    @IsNotEmpty({ message: 'Password không được để trống' })
    @IsString()
    @MinLength(8, { message: 'Password phải có ít nhất 8 ký tự' })
    @MaxLength(32, { message: 'Password tối đa 32 ký tự' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
        message:
            'Password phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
    })
    password: string;

    @ApiPropertyOptional({
        example: '+84987654321',
        description: 'Số điện thoại của nhân viên (không bắt buộc)',
    })
    @IsOptional()
    @IsString()
    @Matches(/^(?:\+84|0)(?:\d{9})$/, {
        message: 'Số điện thoại không hợp lệ, phải bắt đầu bằng +84 hoặc 0 và có 10 số',
    })
    phone?: string;
}
