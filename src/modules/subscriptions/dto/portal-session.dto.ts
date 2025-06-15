import { IsEmail, IsNotEmpty } from 'class-validator';

export class PortalSessionDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
