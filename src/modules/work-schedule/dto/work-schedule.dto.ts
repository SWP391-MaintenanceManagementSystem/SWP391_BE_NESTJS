import { Expose, Transform } from "class-transformer";

export class WorkScheduleDto {
    @Expose()
    id: string;

    @Expose()
    employeeId: string;

    @Expose()
    shiftId: string;

    @Expose()
    @Transform(({ value }) => value ? value.toISOString().split('T')[0] : null, { toPlainOnly: true })
    date: Date;

    @Expose()
    @Transform(({ value }) => value ? value.toISOString() : null, { toPlainOnly: true })
    createdAt: Date;

    @Expose()
    @Transform(({ value }) => value ? value.toISOString() : null, { toPlainOnly: true })
    updatedAt: Date;

    @Expose()
    employee?: {
        id: string;
        firstName: string;
        lastName: string;
        account?: {
            id: string;
            email: string;
        };
    }

    @Expose()
    shift?: {
        id: string;
        name: string;
        startTime: string;
        endTime: string;
        serviceCenter?: {
            id: string;
            name: string;
        };
    }
}
