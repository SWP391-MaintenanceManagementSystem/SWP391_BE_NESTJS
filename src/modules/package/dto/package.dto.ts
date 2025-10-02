import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class PackageDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    price: number;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    @ApiProperty({
    type: () => [Object]})
    @Expose()
    packageDetails: object[];


}
