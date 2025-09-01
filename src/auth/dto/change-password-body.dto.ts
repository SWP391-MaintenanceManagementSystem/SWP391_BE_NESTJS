import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";


export default class ChangePasswordBodyDTO {

    @IsNotEmpty({ message: 'Old password is required' })
    @ApiProperty({ example: 'oldPassword123' })
    oldPassword: string;

    @IsNotEmpty({ message: 'New password is required' })
    @ApiProperty({ example: 'newPassword123' })
    newPassword: string;

    @IsNotEmpty({ message: 'Password confirmation is required' })
    @ApiProperty({ example: 'newPassword123' })
    confirmNewPassword: string;
}