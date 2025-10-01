import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Length, Matches } from 'class-validator';

export default class ChangePasswordBodyDTO {
  @IsNotEmpty({ message: 'Old password is required' })
  @ApiProperty({ example: 'oldPassword123!' })
  oldPassword: string;

  @IsNotEmpty({ message: 'New password is required' })
  @ApiProperty({ example: 'newPassword123!' })
  @Length(8, 50, { message: 'Password must be between 8 and 50 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  newPassword: string;

  @IsNotEmpty({ message: 'Password confirmation is required' })
  @ApiProperty({ example: 'newPassword123!' })
  confirmNewPassword: string;
}
