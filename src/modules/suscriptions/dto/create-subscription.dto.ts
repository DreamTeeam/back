import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  priceId: string; // id que tengo en la nota q saque del dashboard de stripe

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
