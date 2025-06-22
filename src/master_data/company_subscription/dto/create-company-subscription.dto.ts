import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUUID,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';

enum SubscriptionStatus {
  Active = 'active',
  Cancelled = 'cancelled',
  Expired = 'expired',
}
enum PaymentStatus {
  Paid = 'paid',
  Unpaid = 'unpaid',
  PastDue = 'past_due',
}

export class CreateCompanySubscriptionDto {
  @IsUUID()
  @IsNotEmpty()
  customer_d: string; // ID de la zapatería a la que pertenece la suscripción

  @IsUUID()
  @IsNotEmpty()
  membership_type_id: string; // ID del tipo de membresía (Básico, Pro, Premium, Trial)

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  stripe_subscription_id: string; // ID de la suscripción en Stripe

  @IsDateString()
  @IsNotEmpty()
  start_date: Date;

  @IsDateString()
  @IsNotEmpty()
  end_date: Date;

  @IsString()
  @IsNotEmpty()
  @IsEnum(SubscriptionStatus)
  status: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  paymentStatus: string;
}
