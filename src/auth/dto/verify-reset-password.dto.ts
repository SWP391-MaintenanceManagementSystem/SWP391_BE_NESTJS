import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetPasswordDTO {
    @ApiProperty({
        example: 'user@example.com',
        format: 'email'
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({
        example: '123456',
    })
    @IsNotEmpty({ message: 'Verification code is required' })
    code: string;
}