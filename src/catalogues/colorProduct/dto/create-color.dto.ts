import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateColorDto {
  @ApiProperty({ example: 'Negro' })
  @IsString()
  @IsNotEmpty()
  color: string;
}