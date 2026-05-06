import { NextResponse } from "next/server";

const ROLE_ROUTES = {
  admin: "/dashboard/admin",
  sudo: "/dashboard/sudo",
  hod: "/dashboard/hod",
  coordinator: "/dashboard/coordinator",
  advisor: "/dashboard/advisor",
  mentor: "/dashboard/mentor",
  student: "/dashboard/student",
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (
    pathname === "/signin" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get session cookie
  const sessionCookie = request.cookies.get(
    `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
  );

  // In production with cross-domain Appwrite, the cookie might not be available to middleware
  // We let it proceed and let the client-side AuthProvider handle it.
  if (!sessionCookie) {
    return NextResponse.next();
  }

  // Verify session with Appwrite
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout for production
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/account`,
      {
        headers: {
          "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
          Cookie: `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}=${sessionCookie.value}`,
        },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Only redirect if we specifically get a 401/403 (invalid session)
      if (response.status === 401 || response.status === 403) {
        return NextResponse.redirect(new URL("/signin", request.url));
      }
      // For other errors (500, etc.), let the client handle it
      return NextResponse.next();
    }

    const user = await response.json();
    const userLabels = user.labels && user.labels.length > 0 ? user.labels : ["unassigned"];

    // Handle unassigned users
    if (
      userLabels.includes("unassigned") &&
      pathname !== "/dashboard/unassigned" &&
      pathname.startsWith("/dashboard")
    ) {
      return NextResponse.redirect(new URL("/dashboard/unassigned", request.url));
    }

    // Check role-based access for dashboard routes
    if (pathname.startsWith("/dashboard/")) {
      const pathParts = pathname.split("/");
      const requestedRole = pathParts[2];

      // Allow access to base dashboard and unassigned
      if (!requestedRole || requestedRole === "unassigned") {
        return NextResponse.next();
      }

      // Verify user has the requested role
      if (!userLabels.includes(requestedRole)) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Log errors in production if they are unexpected (not timeouts/network)
    if (error.name !== 'AbortError' && !error.message?.includes('fetch') && !error.message?.includes('network')) {
      console.error("[Middleware Error]", {
        name: error.name,
        message: error.message,
        path: pathname
      });
    }
    
    // Fail open on network/timeout errors to avoid blocking the user
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
