import { IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateVehicleDTO {
    @ApiProperty({
        description: "Vehicle Identification Number (VIN)",
        example: "1HGCM82633A004352",
    })
    @IsNotEmpty()
    @IsString()
    @Matches(/^[A-HJ-NPR-Z0-9]{17}$/, {
        message: "VIN must be exactly 17 characters (A-H, J-N, P, R-Z, 0-9), excluding I, O, Q",
    })
    vin: string;

    @ApiProperty({
        description: "License plate number of the vehicle",
        example: "51H-12345",
    })
    @IsNotEmpty()
    @IsString()
    @Matches(/^\d{2,3}[A-Z]-\d{4,5}$/, {
        message: "License plate must follow the VN format (e.g., 51H-12345)",
    })
    licensePlate: string;

    @ApiProperty({
        description: "ID of the vehicle model",
        example: 101,
    })
    @IsNotEmpty()
    @IsNumber()
    modelId: number;
}
