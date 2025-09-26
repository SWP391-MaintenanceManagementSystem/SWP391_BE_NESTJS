import { AccountRole, AccountStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { CustomerFilterDTO } from "./customer-filter.dto";


export class AccountFilterDTO {
    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEnum(AccountRole)
    role?: AccountRole;

    @IsOptional()
    @IsEnum(AccountStatus)
    status?: AccountStatus;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    customer?: CustomerFilterDTO;
}