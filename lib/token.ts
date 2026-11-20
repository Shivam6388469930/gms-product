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

export function createAccessToken(userId: string, role?: string): string {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is missing");
  }

  const rawExpires = process.env.ACCESS_TOKEN_EXPIRES || "7d";
  const expiresIn = rawExpires === "15m" ? "7d" : rawExpires;

  return jwt.sign(
    {
      userId,
      role: role || "client",
      type: "access",
    },
    secret,
    {
      expiresIn: expiresIn as any,
    }
  );
}
