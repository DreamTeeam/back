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
import { DataSource } from 'typeorm';
import { CreateSubscriptionDto } from './create-subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('checkout-session')
  async createSubscriptionCheckout(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createSubscriptionCheckout(
      createSubscriptionDto,
    );
  }

  @Get('status/:userId')
  async getMembershipStatus(@Param('userId') userId: string) {
    const isActive = await this.subscriptionsService.isMembershipActive(userId);
    return { userId, isActive };
  }
}
