import { config } from 'dotenv';
config();

export const FRONTEND_URL = process.env.FRONTEND_URL as string;
export const OTP_EXPIRATION_MINUTES = Number(
  process.env.OTP_EXPIRATION_MINUTES,
);
export const jwtConstants = { secret: process.env.JWT_SECRET as string };
export const ACCESS_TOKEN_EXPIRATION =
  (process.env.JWT_EXPIRATION_TIME as string) || '15m';
