import Stripe from "stripe"

export const stripeComplete = async (stripe: Stripe, sessionId: string) => {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
}