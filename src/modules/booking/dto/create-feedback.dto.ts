import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
export class CreateFeedbackDTO {
  @ApiProperty({
    description: 'The ID of the booking to provide feedback for',
    example: 'bkg_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({
    description: 'The rating given for the booking',
    example: 5,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  rating: number;

  @ApiProperty({
    description: 'The feedback text for the booking',
    example: 'Great service!',
    required: false,
  })
  @IsString()
  @IsOptional()
  feedback: string;
}
