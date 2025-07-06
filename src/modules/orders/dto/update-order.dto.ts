import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderDto {
  @ApiProperty({
    example: OrderStatus.CANCELLED,
    enum: OrderStatus,
    description: 'El nuevo estado de la orden',
  })
  @IsEnum(OrderStatus, {
    message: `El estado debe ser uno de los siguientes: ${Object.values(OrderStatus).join(', ')}`,
  })
  @IsOptional()
  status?: OrderStatus;
}






// import { ApiProperty } from '@nestjs/swagger';
// import { IsOptional, IsString } from 'class-validator';

// export class UpdateOrderDto {
//   @ApiProperty({ example: 'Cancelada' })
//   @IsString()
//   @IsOptional()
//   status?: string;
// }
