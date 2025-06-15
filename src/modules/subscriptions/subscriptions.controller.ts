import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { User } from '../temp-entities/users.placeholder.entity';
import { DataSource } from 'typeorm';
import { PortalSessionDto } from './dto/portal-session.dto';
import { Membership } from './entities/membership.entity';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly dataSource: DataSource,
  ) {}

  @Post('checkout-session')
  async createSubscriptionCheckout(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    const { price_id, email } = createSubscriptionDto;
    const user = await this.dataSource.getRepository(User).findOneBy({ email });
    if (!user) {
      throw new NotFoundException(`Usuario con email ${email} no encontrado.`);
    }
    return this.subscriptionsService.createSubscriptionCheckout(price_id, user);
  }

  @Get('status/:userId')
  async getMembershipStatus(@Param('clientId') userId: string) {
    const isActive = await this.subscriptionsService.isMembershipActive(userId);
    return { userId, isActive };
  }
}
