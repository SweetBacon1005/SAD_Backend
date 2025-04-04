import { config } from 'dotenv';
config();

export const FRONTEND_URL = process.env.FRONTEND_URL as string;
export const OTP_EXPIRATION_MINUTES = 1;
export const jwtConstants = { secret: process.env.JWT_SECRET as string };
