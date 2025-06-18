import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateMembershipStatusDto {
  @IsString()
  @IsOptional()
  membershipStatus?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}