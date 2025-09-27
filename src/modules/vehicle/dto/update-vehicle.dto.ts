import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsNumber, Matches, IsString } from "class-validator";


export class UpdateVehicleDTO {
    @ApiProperty({
        description: 'Vehicle Identification Number (VIN)',
        example: '1HGCM82633A004352',
    })
    @IsOptional()
    @IsString()
    @Matches(/^[A-HJ-NPR-Z0-9]{17}$/, {
        message: 'VIN must be exactly 17 characters (A-H, J-N, P, R-Z, 0-9), excluding I, O, Q',
    })
    vin: string;

    @ApiProperty({
        description: 'License plate number of the vehicle',
        example: '51H-12345',
    })
    @IsOptional()
    @IsString()
    @Matches(/^\d{2,3}[A-Z]-\d{4,5}$/, {
        message: 'License plate must follow the VN format (e.g., 51H-12345)',
    })
    licensePlate: string;

    @ApiProperty({
        description: 'ID of the vehicle model',
        example: 1,
    })
    @IsOptional()
    @IsNumber()
    modelId: number;
}
