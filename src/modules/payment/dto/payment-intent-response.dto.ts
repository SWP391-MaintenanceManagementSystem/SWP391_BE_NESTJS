import Stripe from 'stripe';

export class PaymentIntentResponseDTO {
  clientSecret: string;
  paymentIntent: Stripe.PaymentIntent;
}
