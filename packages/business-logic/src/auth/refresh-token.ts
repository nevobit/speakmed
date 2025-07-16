import jwt from 'jsonwebtoken';

const { JWT_SECRET, JWT_REFRESH_SECRET } = process.env;
export const refreshToken = (token: string) => {
    const id = "";
    const decodeRefreshToken = jwt.verify(token, JWT_REFRESH_SECRET);

    console.log(decodeRefreshToken)
    const accessToken = jwt.sign({ id }, JWT_SECRET, { subject: "accessApi", expiresIn: "1d" });
    const newRefreshToken = jwt.sign({ id }, JWT_REFRESH_SECRET, { subject: "refreshToken", expiresIn: "1w" });

    return {
        accessToken,
        refreshToken: newRefreshToken
    }

}