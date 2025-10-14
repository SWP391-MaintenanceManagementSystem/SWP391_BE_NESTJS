import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBookingAssignmentsDTO {
  @IsString()
  @ApiProperty({
    example: 'f1d23654-07fa-4b3e-9e0d-f2e32baf6a90',
  })
  bookingId: string;

  @IsString({ each: true })
  @ApiProperty({
    example: ['f1d23654-07fa-4b3e-9e0d-f2e32baf6a90'],
  })
  employeeIds: string[];
}
