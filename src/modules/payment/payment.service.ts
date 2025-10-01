import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Membership, Method, ReferenceType, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { SubscriptionService } from '../subscription/subscription.service';
import { MembershipDTO } from '../membership/dto/membership.dto';

// todo import Booking
type PaymentReference = MembershipDTO;

@Injectable()
export class PaymentService {
  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripeClient: Stripe,
    private readonly prismaService: PrismaService,
    public readonly subscriptionService: SubscriptionService
  ) {}

  async createCheckoutSession(
    customerId: string,
    referenceId: string,
    referenceType: ReferenceType,
    amount: number
  ): Promise<{ url: string }> {
    let reference: PaymentReference | null = null;
    switch (referenceType) {
      case ReferenceType.MEMBERSHIP:
        reference = (await this.prismaService.membership.findUnique({
          where: { id: referenceId },
        })) as MembershipDTO;
        if (!reference) {
          throw new Error('Membership not found');
        }
        break;
      case ReferenceType.BOOKING:
        const booking = await this.prismaService.booking.findUnique({
          where: { id: referenceId },
        });
        if (!booking) {
          throw new Error('Booking not found');
        }
        break;
      default:
        throw new Error('Invalid reference type');
    }

    const transaction = await this.prismaService.transaction.create({
      data: {
        amount,
        customerId,
        referenceId,
        status: TransactionStatus.PENDING,
        method: Method.CARD,
        referenceType: referenceType,
      },
    });

    const session = await this.stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: referenceType },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: {
        transactionId: transaction.id,
        referenceId,
        referenceType,
        customerId,
      },
    });
    if (!session.url) {
      throw new InternalServerErrorException('Failed to create checkout session');
    }
    return { url: session.url };
  }

  async handleWebhook(event: Stripe.Event) {
    const { type } = event;
    switch (type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSuccess(event);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event);
        break;
    }
  }

  private async handleCheckoutSuccess(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    const transactionId = session.metadata?.transactionId;
    await this.prismaService.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.SUCCESS },
    });
    const metadata = session.metadata;
    if (!metadata) {
      throw new Error('No metadata found in session');
    }
    switch (metadata.referenceType) {
      case ReferenceType.MEMBERSHIP:
        await this.subscriptionService.createSubscription(
          metadata.referenceId,
          metadata.customerId
        );
      case ReferenceType.BOOKING:
        break;
      default:
        throw new Error('Invalid reference type');
    }
    //TODO: Email notification
  }

  private async handlePaymentFailed(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const transactionId = paymentIntent.metadata.transactionId;
    await this.prismaService.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.FAILED },
    });
  }
}
