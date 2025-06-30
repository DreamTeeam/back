import {
  Controller,
  Post,
  Body,
  Logger,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Delete,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateCancellationDto } from '../cancellation/dto/create-cancellation.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Employee } from '../users/entities/employee.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.processNewOrder(createOrderDto);
  }

  @Get(':id')
  findOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOneById(id);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Put(':id')
  updateOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createCancellationDto: CreateCancellationDto,
    @GetUser() employee: Employee,
  ) {
    if (!employee) {
      throw new UnauthorizedException(
        'No se pudo identificar al empleado en la sesión.',
      );
    }

    return this.ordersService.cancelOrder(
      id,
      employee.id,
      createCancellationDto,
    );
  }
}
