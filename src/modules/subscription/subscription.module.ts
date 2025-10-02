import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { MembershipModule } from '../membership/membership.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [MembershipModule, CustomerModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
