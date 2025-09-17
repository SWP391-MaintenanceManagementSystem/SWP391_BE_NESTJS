import { Expose, Transform } from "class-transformer";

export class EmployeeDTO {
    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose()
    specialization?: string;

    @Expose()
    experienceYears?: number;

    // TODO: make certificate DTO
    @Expose()
    certificate?: string;

    @Expose()
    @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
    createdAt: Date;

    @Expose()
    @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
    updatedAt: Date;
}