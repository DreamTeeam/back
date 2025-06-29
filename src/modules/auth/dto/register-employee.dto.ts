import { CreateUserDto } from '../../users/dto/create-user.dto';
import { IsArray, IsUUID, IsOptional } from 'class-validator';

export class RegisterEmployeeDto extends CreateUserDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true }) 
  roles?: string[];
}
