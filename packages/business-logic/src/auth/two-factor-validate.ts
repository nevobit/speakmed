import { authenticator } from "otplib";
import qrcode from "qrcode";

export const validateTwofactor = async (totp: string) => {
    const id = "";
    const secret = "";

    //TODO: get user 2fa secret

    console.log(qrcode, id);


    const verified = authenticator.check(totp, secret)

    return { verified }
}