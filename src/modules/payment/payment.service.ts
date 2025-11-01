import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Booking, Method, ReferenceType, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { SubscriptionService } from '../subscription/subscription.service';
import { MembershipDTO } from '../membership/dto/membership.dto';
import { plainToInstance } from 'class-transformer';
import { TransactionDTO } from './dto/transaction.dto';
import { encodeBase64 } from 'src/utils';

type PaymentReference = MembershipDTO | Booking;

@Injectable()
export class PaymentService {
  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripeClient: Stripe,
    private readonly prismaService: PrismaService,
    public readonly subscriptionService: SubscriptionService
  ) {}

  private async createStripeSession(
    txId: string,
    referenceType: ReferenceType,
    referenceId: string,
    customerId: string,
    amount: number
  ): Promise<{ sessionId: string; url: string }> {
    const session = await this.stripeClient.checkout.sessions.create({
      mode: 'payment',
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
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: {
        transactionId: txId,
        referenceId,
        referenceType,
        customerId,
      },
    });

    if (!session.url) {
      throw new InternalServerErrorException('Failed to create checkout session');
    }

    return { sessionId: session.id, url: session.url };
  }

  async createCheckoutSession(
    customerId: string,
    referenceId: string,
    referenceType: ReferenceType,
    amount: number
  ): Promise<{ url: string }> {
    const existingTx = await this.prismaService.transaction.findFirst({
      where: {
        referenceId,
        customerId,
        status: TransactionStatus.PENDING,
      },
    });

    if (amount === 0 && referenceType === ReferenceType.BOOKING) {
      const booking = await this.prismaService.booking.findUnique({
        where: { id: referenceId, customerId },
      });
      if (!booking) throw new NotFoundException('Booking not found');
      await this.prismaService.booking.update({
        where: { id: referenceId },
        data: { status: 'CHECKED_OUT' },
      });
      const encodedId = encodeBase64(existingTx?.id || '');
      return {
        url: `${process.env.FRONTEND_URL}/payment-success?free=true&transaction_id=${encodedId}`,
      };
    }

    if (existingTx) {
      if (!existingTx.sessionId) {
        const { sessionId, url } = await this.createStripeSession(
          existingTx.id,
          referenceType,
          referenceId,
          customerId,
          amount
        );

        await this.prismaService.transaction.update({
          where: { id: existingTx.id },
          data: { sessionId },
        });

        return { url };
      }

      const checkoutSession = await this.stripeClient.checkout.sessions.retrieve(
        existingTx.sessionId
      );

      if (checkoutSession.url) {
        return { url: checkoutSession.url };
      }

      const { sessionId, url } = await this.createStripeSession(
        existingTx.id,
        referenceType,
        referenceId,
        customerId,
        amount
      );

      await this.prismaService.transaction.update({
        where: { id: existingTx.id },
        data: { sessionId },
      });

      return { url };
    }

    let reference: PaymentReference | null = null;

    switch (referenceType) {
      case ReferenceType.MEMBERSHIP:
        reference = (await this.prismaService.membership.findUnique({
          where: { id: referenceId },
        })) as MembershipDTO;
        if (!reference) throw new NotFoundException('Membership not found');
        break;

      case ReferenceType.BOOKING:
        reference = await this.prismaService.booking.findUnique({
          where: { id: referenceId, status: 'COMPLETED', customerId },
        });
        if (!reference) throw new NotFoundException('Booking not found or not completed');
        break;

      default:
        throw new BadRequestException('Invalid reference type');
    }

    const transaction = await this.prismaService.transaction.create({
      data: {
        amount,
        customerId,
        referenceId,
        status: TransactionStatus.PENDING,
        method: Method.CARD,
        referenceType,
      },
    });
    const { sessionId, url } = await this.createStripeSession(
      transaction.id,
      referenceType,
      referenceId,
      customerId,
      amount
    );
    await this.prismaService.transaction.update({
      where: { id: transaction.id },
      data: { sessionId },
    });

    return { url };
  }

  async handleWebhook(event: Stripe.Event) {
    const { type } = event;
    switch (type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSuccess(event);
        break;
      case 'checkout.session.async_payment_failed':
        await this.handlePaymentFailed(event);
        break;
      default:
        console.warn(`Unhandled event type: ${type}`);
    }
  }

  private async handleCheckoutSuccess(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session?.metadata;
    if (!metadata) {
      throw new InternalServerErrorException('No metadata found in session');
    }
    const { transactionId, referenceId, referenceType, customerId } = metadata;
    await this.prismaService.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.SUCCESS },
    });

    switch (referenceType) {
      case ReferenceType.MEMBERSHIP:
        return await this.subscriptionService.updateOrCreateSubscription(referenceId, customerId);
      case ReferenceType.BOOKING:
        return await this.prismaService.booking.update({
          where: { id: referenceId },
          data: { status: 'CHECKED_OUT' },
        });
      default:
        throw new BadRequestException('Invalid reference type');
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

  async getTransactionBySessionId(sessionId: string) {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { sessionId },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return plainToInstance(TransactionDTO, transaction);
  }

  async getTransactionById(transactionId: string) {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return plainToInstance(TransactionDTO, transaction);
  }
}
