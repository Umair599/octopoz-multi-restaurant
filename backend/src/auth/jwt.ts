import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const SECRET = process.env.JWT_SECRET || "dev_secret";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

export function sign(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verify(token: string) {
  try {
    return jwt.verify(token, SECRET) as any;
  } catch (e) {
    return null;
  }
}
