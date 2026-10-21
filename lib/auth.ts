import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/**
 * ADAPT THIS to match your /api/auth/login route:
 * - cookie name that holds the access token
 * - env var holding the signing secret
 * - claim that holds the user id (sub / id / userId handled below)
 */
const ACCESS_COOKIE = "accessToken";

export async function getUserId(): Promise<string | null> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    const p = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as Record<string, string>;
    return p.sub ?? p.id ?? p.userId ?? null;
  } catch {
    return null;
  }
}