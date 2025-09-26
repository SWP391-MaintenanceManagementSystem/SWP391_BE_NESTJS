import { Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { AccountFilterDTO } from "./account-filter.dto";

export class CustomerFilterDTO extends AccountFilterDTO {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isPremium?: boolean;
}