import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Id de empresa',
    example: '8d3d4281-67b1-4433-b6ef-2d41fa6fb146',
  })
  @IsUUID()
  @IsNotEmpty() //? PREGUNTAR aca modifique id: decia customer_d , es incorrecto verdad ?
  customer_id: string; // ID de la zapatería a la que pertenece la suscripción

  @ApiProperty({
    description: 'Id tipo de membresia',
    example: '8d3d4281-67b1-4433-b6ef-2d41fa6fb146',
  })
  @IsUUID()
  @IsNotEmpty()
  membership_type_id: string; // ID del tipo de membresía (Básico, Pro, Premium, Trial)

  @ApiProperty({
    description: 'Id suscripcion de Stripe',
    example: 'price_1RY9XPR3HFaVLTa4WcOvViUc',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  stripe_subscription_id: string; // ID de la suscripción en Stripe

  @ApiProperty({
    description: 'Id cliente de Stripe',
    example: 'cus_SY4bkQQUUhTXr4',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  stripe_customer_id: string; // ID de cliente en stripe

  @ApiProperty({
    description: 'fecha de inicio de la suscripcion',
    example: '01-01-2025',
  })
  @IsDateString()
  @IsNotEmpty()
  start_date: Date;

  @ApiProperty({
    description: 'fecha de finalizacion de la suscripcion',
    example: '01-09-2025',
  })
  @IsDateString()
  @IsNotEmpty()
  end_date: Date;

  @ApiProperty({
    description: 'status de la membresia',
    example: 'active',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(SubscriptionStatus)
  status: string;

  @ApiProperty({
    description: 'status del pago',
    example: 'paid',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  payment_status: string;
}
