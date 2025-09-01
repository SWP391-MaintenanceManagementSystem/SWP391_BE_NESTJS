import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";



export default class ResetPasswordBodyDTO {

    @IsNotEmpty()
    @ApiProperty({ example: '123456' })
    code: string

    @IsNotEmpty()
    @ApiProperty({ example: 'newPassword123' })
    newPassword: string

    @IsNotEmpty()
    @ApiProperty({ example: 'newPassword123' })
    confirmNewPassword: string

}