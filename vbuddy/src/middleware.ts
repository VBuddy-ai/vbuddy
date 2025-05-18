import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { generateCSRFToken, validateCSRFToken } from "@/lib/csrf";

// Rate limiting configuration
const RATE_LIMITS = {
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  auth: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 login attempts per hour
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 API requests per minute
  },
};

// Store rate limit data in memory (consider using Redis in production)
const rateLimitStore = new Map<
  string,
  {
    count: number;
    resetTime: number;
    lastRequestTime: number;
  }
>();

// Session timeout configuration
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// CSRF protected methods
const CSRF_PROTECTED_METHODS = ["POST", "PUT", "DELETE", "PATCH"];

function getRateLimitConfig(pathname: string) {
  if (pathname.startsWith("/api/")) {
    return RATE_LIMITS.api;
  }
  if (pathname === "/login" || pathname === "/signup") {
    return RATE_LIMITS.auth;
  }
  return RATE_LIMITS.default;
}

function checkRateLimit(
  ip: string,
  pathname: string
): { limited: boolean; retryAfter: number } {
  const config = getRateLimitConfig(pathname);
  const now = Date.now();
  const key = `${ip}:${pathname}`;
  const rateLimit = rateLimitStore.get(key);

  if (rateLimit) {
    if (now > rateLimit.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        lastRequestTime: now,
      });
      return { limited: false, retryAfter: 0 };
    }

    // Check for rapid requests (DoS protection)
    if (now - rateLimit.lastRequestTime < 100) {
      // 100ms minimum between requests
      return {
        limited: true,
        retryAfter: Math.ceil((rateLimit.lastRequestTime + 100 - now) / 1000),
      };
    }

    if (rateLimit.count >= config.max) {
      return {
        limited: true,
        retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000),
      };
    }

    rateLimit.count++;
    rateLimit.lastRequestTime = now;
  } else {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      lastRequestTime: now,
    });
  }

  return { limited: false, retryAfter: 0 };
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { pathname } = req.nextUrl;
  const { limited, retryAfter } = checkRateLimit(ip, pathname);

  if (limited) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Reset": retryAfter.toString(),
      },
    });
  }

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Session timeout check
  const lastActivity = req.cookies.get("last_activity")?.value;
  if (user && lastActivity) {
    const lastActivityTime = parseInt(lastActivity);
    if (Date.now() - lastActivityTime > SESSION_TIMEOUT) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Update last activity timestamp
  res.cookies.set({
    name: "last_activity",
    value: Date.now().toString(),
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TIMEOUT / 1000,
  });

  // CSRF Protection
  if (CSRF_PROTECTED_METHODS.includes(req.method)) {
    const sessionId = user?.id || ip;
    const csrfToken = req.headers.get("x-csrf-token");

    if (!csrfToken || !validateCSRFToken(sessionId, csrfToken)) {
      return new NextResponse("Invalid CSRF Token", { status: 403 });
    }
  }

  // Generate new CSRF token for authenticated users
  if (user) {
    const sessionId = user.id;
    const csrfToken = await generateCSRFToken(sessionId);
    res.headers.set("X-CSRF-Token", csrfToken);
  }

  // Protect /dashboard and its sub-routes
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const userType = user.user_metadata.user_type;

    // Check if user is trying to access a route for a different role
    if (pathname.startsWith("/dashboard/employer") && userType !== "employer") {
      return NextResponse.redirect(new URL("/dashboard/va", req.url));
    }
    if (pathname.startsWith("/dashboard/va") && userType !== "va") {
      return NextResponse.redirect(new URL("/dashboard/employer", req.url));
    }

    // If user is logged in, check for profile completion
    if (user && !pathname.startsWith(`/dashboard/${userType}/profile/edit`)) {
      const { data: vaProfile } = await supabase
        .from("va_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      const { data: employerProfile } = await supabase
        .from("employer_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!vaProfile && !employerProfile) {
        if (userType) {
          return NextResponse.redirect(
            new URL(`/dashboard/${userType}/profile/edit`, req.url)
          );
        }
      }
    }
  }

  // If user is logged in and tries to access login/signup, redirect to dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const userType = user.user_metadata.user_type;
    return NextResponse.redirect(new URL(`/dashboard/${userType}`, req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (root path, if you have a public landing page not requiring auth)
     * - /api (API routes, if you want to handle auth differently)
     * Feel free to adjust this to your needs.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
