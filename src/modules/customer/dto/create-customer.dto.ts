import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCustomerDTO {

    @IsNotEmpty()
    @IsString()
    accountId: string;

    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsOptional()
    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    address?: string

}
