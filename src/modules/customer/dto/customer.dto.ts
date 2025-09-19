import { Expose, Transform } from "class-transformer";

export class CustomerDTO {
    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    address?: string;

    @Expose()
    is_premium: boolean;

    @Expose()
    @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
    createdAt: Date;

    @Expose()
    @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
    updatedAt: Date;
}