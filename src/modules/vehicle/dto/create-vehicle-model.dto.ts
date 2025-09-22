import { IsNotEmpty, IsString } from "class-validator";


export default class CreateVehicleModelDTO {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    brandId: number;

    @IsNotEmpty()
    @IsString()
    productionYear: number;
}