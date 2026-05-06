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

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Verify session with Appwrite
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
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
      if (response.status === 401 || response.status === 403) {
        return NextResponse.redirect(new URL("/signin", request.url));
      }
      return NextResponse.next();
    }

    const user = await response.json();
    const userLabels = user.labels?.length > 0 ? user.labels : ["unassigned"];

    // Handle unassigned users
    if (
      userLabels.includes("unassigned") &&
      pathname !== "/dashboard/unassigned"
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
    if (process.env.NODE_ENV !== 'production') {
      console.error("[Middleware]", error.name, error.message);
    }
    
    if (error.name === 'AbortError' || error.message?.includes('fetch') || error.message?.includes('network')) {
      return NextResponse.next();
    }
    
    if (error.status === 401 || error.status === 403) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
