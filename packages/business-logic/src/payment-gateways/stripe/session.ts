import Stripe from "stripe"

export const stripeSession = async (stripe: Stripe, productName: string): Promise<string | null> => {
    const session = await stripe.checkout.sessions.create({
        line_items: [{
            price_data: {
                currency: "usd",
                product_data: {
                    name: productName,
                },
                unit_amount: 50
            },
            quantity: 1
        }],
        mode: "payment",
        success_url: "",
        cancel_url: ""
    });

    return session.url;
}