import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface DecodedToken {
  userId?: string;
  role?: string;
  exp?: number;
}

function decodeJwtPayload(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getPanelHomeForRole(role?: string): string {
  const r = (role || "").toLowerCase();
  if (r === "admin" || r === "manager") return "/admin";
  if (r === "supplier") return "/supplier/dashboard";
  if (r === "respondent") return "/respondent/dashboard";
  return "/project";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip public and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/survey") ||
    pathname.startsWith("/s/") ||
    pathname.includes(".") // images, icons, etc.
  ) {
    return NextResponse.next();
  }

  // Check token
  const token = request.cookies.get("accessToken")?.value;
  const decoded = token ? decodeJwtPayload(token) : null;
  const isExpired = decoded?.exp ? decoded.exp * 1000 < Date.now() : true;
  const isAuthenticated = Boolean(token && decoded && !isExpired);
  const userRole = (decoded?.role || "").toLowerCase();

  // Helper redirect to login
  const redirectToLogin = () => {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(url);
  };

  // Helper redirect to user's assigned portal
  const redirectToUserPortal = () => {
    return NextResponse.redirect(new URL(getPanelHomeForRole(userRole), request.url));
  };

  // 2. Admin Panel Protection (/admin, /admin/*)
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isAuthenticated) {
      return redirectToLogin();
    }
    if (userRole !== "admin" && userRole !== "manager") {
      return redirectToUserPortal();
    }
    return NextResponse.next();
  }

  // 3. Supplier Panel Protection (/supplier, /supplier/*)
  if (pathname === "/supplier" || pathname.startsWith("/supplier/")) {
    if (!isAuthenticated) {
      return redirectToLogin();
    }
    if (userRole !== "supplier" && userRole !== "admin") {
      return redirectToUserPortal();
    }
    return NextResponse.next();
  }

  // 4. Respondent Panel Protection (/respondent, /respondent/*)
  if (pathname === "/respondent" || pathname.startsWith("/respondent/")) {
    if (!isAuthenticated) {
      return redirectToLogin();
    }
    if (userRole !== "respondent" && userRole !== "admin") {
      return redirectToUserPortal();
    }
    return NextResponse.next();
  }

  // 5. Buyer Panel Protection (/project, /project/*, /new-project, /dashboard, /invoices)
  const isBuyerRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/project") ||
    pathname.startsWith("/new-project") ||
    pathname.startsWith("/invoices");

  if (isBuyerRoute) {
    if (!isAuthenticated) {
      return redirectToLogin();
    }
    const isBuyerRole =
      ["client", "buyer", "user"].includes(userRole) || userRole === "admin";
    if (!isBuyerRole) {
      return redirectToUserPortal();
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/supplier/:path*",
    "/respondent/:path*",
    "/project/:path*",
    "/new-project/:path*",
    "/dashboard/:path*",
    "/invoices/:path*",
  ],
};

