import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";


export class UpdateCustomerDTO {
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