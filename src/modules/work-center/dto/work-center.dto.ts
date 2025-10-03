import { Expose, Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';

export class WorkCenterDto {
    @Expose()
    @ApiProperty({ example: 'uuid', description: 'Work Center assignment UUID' })
    id: string;

    @Expose()
    @ApiProperty({ example: 'employee-uuid', description: 'Employee account UUID' })
    employeeId: string;

    @Expose()
    @ApiProperty({ example: 'center-uuid', description: 'Service Center UUID' })
    centerId: string;

    @Expose()
    @Transform(({ value }) => value ? value.toISOString() : null, { toPlainOnly: true })
    assignedAt: Date;

    @Expose()
    @Transform(({ value }) => value ? value.toISOString() : null, { toPlainOnly: true })
    createdAt: Date;

    @Expose()
    @Transform(({ value }) => value ? value.toISOString() : null, { toPlainOnly: true })
    updatedAt: Date;

    @Expose()
    @Transform(({ value }) => value ? value.toISOString() : null, { toPlainOnly: true })
    startDate: Date;

    @Expose()
    @Transform(({ value }) => value ? value.toISOString() : null, { toPlainOnly: true })
    endDate: Date;
    @Expose()
    @Type(() => Object)
    @ApiProperty({
        description: 'Employee details',
        type: 'object',
        properties: {
            accountId: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            account: { type: 'object' }
        }
    })
    employee?: {
        accountId: string;
        firstName: string;
        lastName: string;
        account?: {
            email: string;
            role: string;
        };
    };

    @Expose()
    @Type(() => Object)
    @ApiProperty({
        description: 'Service Center details',
        type: 'object',
        properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            address: { type: 'string' },
            status: { type: 'string', enum: Object.values($Enums.CenterStatus) }
        }
    })
    serviceCenter?: {
        id: string;
        name: string;
        address: string;
        status: $Enums.CenterStatus;
    };
}
