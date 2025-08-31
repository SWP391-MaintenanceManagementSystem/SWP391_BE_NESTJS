import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateAccountDTO {

    @IsOptional()
    @IsString()
    @ApiProperty({ example: 'John' })
    firstName: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ example: 'Doe' })
    lastName: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ example: 'https://picsum.photos/id/237/200/300' })
    avatar: string;


}
