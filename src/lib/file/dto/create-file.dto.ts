import { IsString, IsNumber } from 'class-validator';

export class CreateFileDto {
  @IsString()
  filename: string;

  @IsString()
  originalFilename: string;

  @IsString()
  path: string;

  @IsString()
  url: string;

  @IsString()
  fileType: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  size: number;
}
