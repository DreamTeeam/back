import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMembershipTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  stripe_price_id: string;
}
