import { authenticator } from "otplib";
import qrcode from "qrcode";

export const generateTwofactor = async () => {
    const id = "";
    const secret = authenticator.generateSecret();
    const uri = authenticator.keyuri(id, "appName", secret);

    //TODO: update user 2fa secret

    const qrCode = await qrcode.toBuffer(uri, { type: "png", margin: 1 });

    return { qrCode }
}