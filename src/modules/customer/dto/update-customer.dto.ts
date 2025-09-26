import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";


export class UpdateCustomerDTO {

    @IsOptional()
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @ApiProperty({ required: false, example: '', description: 'The email of the customer' })
    email?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false, example: 'John' })
    firstName?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false, example: 'Doe' })
    lastName?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false, example: '+1234567890' })
    phone?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false, example: '123 Main St, City, Country' })
    address?: string;

}