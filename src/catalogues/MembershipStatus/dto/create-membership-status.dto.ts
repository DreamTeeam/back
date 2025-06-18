import { IsString, IsBoolean, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateMembershipStatusDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  membershipStatus: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}