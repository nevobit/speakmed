import jwt from 'jsonwebtoken';

const { JWT_SECRET, JWT_REFRESH_SECRET } = process.env;
export const login = () => {
    const id = "";
    const accessToken = jwt.sign({ id }, JWT_SECRET, { subject: "accessApi", expiresIn: "1d" });
    const refreshToken = jwt.sign({ id }, JWT_REFRESH_SECRET, { subject: "refreshToken", expiresIn: "12" });


    return { token: accessToken, refreshToken }
}