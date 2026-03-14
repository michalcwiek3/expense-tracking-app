import { auth } from "./auth";

export const proxy = auth((req) => {
  const pathname = req.nextUrl.pathname;

  const isLoggedIn = !!req.auth;
  const isLoginPage = pathname === "/login";
  const isCronRoute = pathname === "/api/subscriptions/run";

  if (isCronRoute) {
    return;
  }

  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (isLoggedIn && isLoginPage) {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};