import { IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from '../../users/dto/create-user.dto';

export class RegisterClientDto extends CreateUserDto {
  @IsOptional()
  @IsString()
  membership_id?: string;
}
