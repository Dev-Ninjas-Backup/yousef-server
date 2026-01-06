import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAdminSendmailDto {
    @ApiProperty({ example: 'New Updates Available' })
    @IsString()
    @IsNotEmpty()
    subject: string;

    @ApiProperty({ example: 'Hello, we have exciting updates for you!' })
    @IsString()
    @IsNotEmpty()
    message: string;
}
