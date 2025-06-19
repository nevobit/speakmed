import axios from 'axios';

const { PAYPAL_BASE_URL, PAYPAL_CLIENT_ID, PAYPAL_SECRET } = process.env;

export const generateAccessToken = async (): Promise<string> => {
    const { data } = await axios({
        url: PAYPAL_BASE_URL + "/v1/oauth2/token",
        data: "grant_type=client_crednetials",
        auth: {
            username: PAYPAL_CLIENT_ID,
            password: PAYPAL_SECRET
        }
    });

    return data.access_token;
}

export const createPaymentPaypal = async () => {
    const accessToken = await generateAccessToken();

    const paymentInfo = {
        intent: "CAPTURE",
        purchase_units: [
            {
                items: [{ name: "Product" }],
                amount: {
                    currency_code: "USD", value: "100.00",
                    breakdown: {
                        item_total: {
                            currency_code: "USD", value: "100.00"
                        }
                    }
                },
            }
        ],
        application_context: {
            return_url: "",
            cancel_url: "",
            user_action: "PAY_NOW",
            brand_name: ""
        }

    }
    const { data } = await axios.post("", JSON.stringify(paymentInfo), {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + accessToken
        }
    });

    return data.links.find((link: { rel: string, href: string }) => link.rel === "applove").href;
}