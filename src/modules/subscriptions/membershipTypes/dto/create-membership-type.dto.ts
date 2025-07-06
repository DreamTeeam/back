import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMembershipTypeDto {
  @ApiProperty({
    description: 'Nombre del tipo de membresia',
    example: 'Premium',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Id suscripcion de Stripe',
    example: 'price_1RY9XPR3HFaVLTa4WcOvViUc',
  })
  @IsString()
  @IsNotEmpty()
  stripe_price_id: string;
}
