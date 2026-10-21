// lib/token.ts

import crypto from "crypto";
import jwt from "jsonwebtoken";

export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export function createAccessToken(userId: string): string {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is missing");
  }

  return jwt.sign(
    {
      userId,
      type: "access",
    },
    secret,
    {
      expiresIn: "15m",
    }
  );
}