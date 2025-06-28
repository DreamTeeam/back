import { CreateUserDto } from '../../users/dto/create-user.dto';
import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class RegisterEmployeeDto extends CreateUserDto {
  @IsArray()
  @ArrayNotEmpty() 
  @IsUUID('4', { each: true }) 
  roles: string[];
}