import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional } from 'class-validator';

export class UpdateCancellationDto {
  @ApiProperty({
    description: 'Id motivo de cacelacion de orden de compra',
    example: '075d53fe-2613-4b72-ba5e-3b29a7143c74',
  })
  @IsInt()
  @IsOptional()
  cancellation_reason_id?: string;

  @ApiProperty({
    description: 'comentario sobre motivo de cacelacion de orden de compra',
    example: 'Producto Fallado',
  })
  @IsString()
  @IsOptional()
  cancellation_comment?: string;
}
