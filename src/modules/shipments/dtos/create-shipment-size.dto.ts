import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateShipmentSizeDto {
  @IsNumber()
  @IsNotEmpty()
  size_id: string;

  @IsNumber()
  @IsNotEmpty()
  stock: number;
}
