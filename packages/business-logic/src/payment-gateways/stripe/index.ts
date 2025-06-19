import Stripe from "stripe"

const { STRIPE_SECRET_KEY } = process.env

export const initializeStripe = () => {
    const stripe = new Stripe(STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

    return stripe;
}