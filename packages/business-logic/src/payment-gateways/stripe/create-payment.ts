import Stripe from 'stripe';

export const createPayment = async (stripe: Stripe, amount: number, currency: string) => {
    const paymentIntent = await stripe.paymentIntents.create({
        amount, currency
    });

    return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret as string
    }
}