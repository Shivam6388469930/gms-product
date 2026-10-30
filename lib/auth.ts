// import { cookies } from "next/headers";
// import jwt from "jsonwebtoken";
// import { connectDB } from "@/config/db";
// import User, { IUser } from "@/models/User";

// const ACCESS_COOKIE = "accessToken";

// export async function getUserId(): Promise<string | null> {
//   const cookieStore = await cookies();
//   const token = cookieStore.get(ACCESS_COOKIE)?.value;
//   if (!token) return null;
//   try {
//     const p = jwt.verify(
//       token,
//       process.env.JWT_ACCESS_SECRET!
//     ) as Record<string, any>;
//     return p.sub ?? p.id ?? p.userId ?? null;
//   } catch {
//     return null;
//   }
// }

// /**
//  * Resolves the authenticated user from the JWT access token cookie.
//  * Never trusts frontend-supplied IDs or x-user-id headers.
//  */
// export async function getCurrentUser(): Promise<IUser | null> {
//   const userId = await getUserId();
//   if (!userId) return null;

//   try {
//     await connectDB();
//     const user = await User.findById(userId).select("-password").lean();
//     if (!user || user.isBlocked) return null;
//     return user as unknown as IUser;
//   } catch (err) {
//     console.error("getCurrentUser error:", err);
//     return null;
//   }
// }

// /**
//  * Enforces authentication and optional role restrictions.
//  * Returns { user, error, status }.
//  */
// export async function requireAuth(allowedRoles?: string[]): Promise<{
//   user: IUser | null;
//   error: string | null;
//   status: number;
// }> {
//   const user = await getCurrentUser();
//   if (!user) {
//     return { user: null, error: "Authentication required", status: 401 };
//   }

//   if (allowedRoles && allowedRoles.length > 0) {
//     const userRole = (user.role || "").toLowerCase();
//     // Admin always has global access
//     if (userRole === "admin" || userRole === "manager") {
//       return { user, error: null, status: 200 };
//     }

//     const matchesRole = allowedRoles.some((role) => {
//       const r = role.toLowerCase();
//       if (r === "buyer") {
//         return ["client", "user", "buyer"].includes(userRole);
//       }
//       return r === userRole;
//     });

//     if (!matchesRole) {
//       return {
//         user: null,
//         error: "Forbidden: You do not have permission to access this resource",
//         status: 403,
//       };
//     }
//   }

//   return { user, error: null, status: 200 };
// }


import "server-only";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { connectDB } from "@/config/db";
import User, { IUser } from "@/models/User";

const ACCESS_COOKIE = "accessToken";

/**
 * Get authenticated user ID from the HTTP-only JWT cookie.
 *
 * IMPORTANT:
 * This function is SERVER ONLY.
 * Never import this file from a Client Component.
 */
export async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get(ACCESS_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const secret =
      process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      console.error(
        "JWT_ACCESS_SECRET is not configured"
      );

      return null;
    }

    const payload = jwt.verify(
      token,
      secret
    ) as Record<string, any>;

    const userId =
      payload.sub ??
      payload.id ??
      payload.userId;

    if (!userId) {
      return null;
    }

    return String(userId);
  } catch (error) {
    console.error(
      "getUserId error:",
      error
    );

    return null;
  }
}

/**
 * Resolve the authenticated user from
 * the HTTP-only JWT access token cookie.
 *
 * SERVER ONLY.
 */
export async function getCurrentUser(): Promise<IUser | null> {
  const userId = await getUserId();

  if (!userId) {
    return null;
  }

  try {
    await connectDB();

    const user = await User.findById(userId)
      .select("-password")
      .lean();

    if (!user || user.isBlocked) {
      return null;
    }

    return user as unknown as IUser;
  } catch (error) {
    console.error(
      "getCurrentUser error:",
      error
    );

    return null;
  }
}

/**
 * Require authenticated user and optionally
 * restrict access by role.
 *
 * SERVER ONLY.
 */
export async function requireAuth(
  allowedRoles?: string[]
): Promise<{
  user: IUser | null;
  error: string | null;
  status: number;
}> {
  const user =
    await getCurrentUser();

  if (!user) {
    return {
      user: null,
      error: "Authentication required",
      status: 401,
    };
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0
  ) {
    const userRole =
      String(user.role || "")
        .toLowerCase();

    // Admin / manager have global access
    if (
      userRole === "admin" ||
      userRole === "manager"
    ) {
      return {
        user,
        error: null,
        status: 200,
      };
    }

    const matchesRole =
      allowedRoles.some((role) => {
        const normalizedRole =
          role.toLowerCase();

        if (
          normalizedRole === "buyer"
        ) {
          return [
            "client",
            "user",
            "buyer",
          ].includes(userRole);
        }

        return (
          normalizedRole ===
          userRole
        );
      });

    if (!matchesRole) {
      return {
        user: null,
        error:
          "Forbidden: You do not have permission to access this resource",
        status: 403,
      };
    }
  }

  return {
    user,
    error: null,
    status: 200,
  };
}
