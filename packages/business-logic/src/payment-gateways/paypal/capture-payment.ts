import axios from "axios";
import { generateAccessToken } from "./create-payment"

const { PAYPAL_BASE_URL } = process.env;
export const capturePaymentPaypal = async (orderId: string) => {
    const accessToken = await generateAccessToken();

    const { data } = await axios.post(PAYPAL_BASE_URL + `/v2/chackout/orders/${orderId}/capture`, {}, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + accessToken
        }
    });

    return data
}