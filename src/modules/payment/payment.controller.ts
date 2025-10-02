import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Headers,
  HttpCode,
  Inject,
  Res,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { AccountRole } from '@prisma/client';
import { Roles } from 'src/common/decorator/role.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { JWT_Payload } from 'src/common/types';
import { CreatePaymentIntentDTO } from './dto/create-payment-intent.dto';
import { Public } from 'src/common/decorator/public.decorator';

@Controller('api/payment')
@ApiBearerAuth('jwt-auth')
@ApiTags('Payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    @Inject('STRIPE_CLIENT') private readonly stripeClient: Stripe
  ) {}

  @Post()
  @Roles(AccountRole.CUSTOMER)
  async createCheckoutSession(
    @Body() body: CreatePaymentIntentDTO,
    @CurrentUser() user: JWT_Payload
  ) {
    const { referenceId, referenceType, amount } = body;

    const { url } = await this.paymentService.createCheckoutSession(
      user.sub,
      referenceId,
      referenceType,
      amount
    );

    return {
      message: 'Checkout session created successfully',
      data: url,
    };
  }

  /** Webhook Stripe */
  @Post('webhook')
  @Public()
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') sig: string
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripeClient.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    res.json({ received: true });

    await this.paymentService.handleWebhook(event).catch(err => {
      console.error('Webhook handler error:', err);
    });
    return {
      message: 'Webhook handled',
      data: null,
    };
  }
}
