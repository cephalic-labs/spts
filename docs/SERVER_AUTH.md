# Server-Side Authorization Implementation

## Overview
This implementation adds server-side session validation and role-based access control using Next.js middleware and server actions.

## Files Created

### 1. `/middleware.js` (Root Level)
- Validates Appwrite session cookies before pages load
- Enforces role-based access to dashboard routes
- Redirects unauthorized users before any data is fetched
- Runs on the server, cannot be bypassed by disabling JavaScript

### 2. `/src/actions/session.js`
- Server actions for validating sessions in server components
- `getServerSession()` - Get current user from server
- `validateRole(allowedRoles)` - Check if user has required roles

## Usage Examples

### In Server Components (Recommended)

```javascript
import { validateRole } from "@/actions/session";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const { authorized, user } = await validateRole(["admin", "sudo"]);
  
  if (!authorized) {
    redirect("/unauthorized");
  }

  // Fetch sensitive data here - only runs if authorized
  const data = await fetchAdminData();
  
  return <div>Admin Dashboard for {user.name}</div>;
}
```

### In API Routes

```javascript
import { validateRole } from "@/actions/session";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { authorized, user } = await validateRole(["admin", "sudo"]);
  
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Process request
  return NextResponse.json({ data: "sensitive data" });
}
```

### In Server Actions

```javascript
"use server";

import { validateRole } from "@/actions/session";

export async function deleteUser(userId) {
  const { authorized } = await validateRole(["admin", "sudo"]);
  
  if (!authorized) {
    return { success: false, error: "Unauthorized" };
  }

  // Perform deletion
  return { success: true };
}
```

## Security Benefits

1. **Server-Side Validation**: Session checked before page renders
2. **No Client Bypass**: Cannot be disabled via JavaScript
3. **Cookie-Based Auth**: Uses secure HTTP-only cookies
4. **Role Enforcement**: Validates user roles server-side
5. **API Protection**: Secure API routes and server actions

## Migration Notes

- Keep existing `RoleProtected.js` and `ProtectedRoute.js` for UI/UX (loading states, smooth redirects)
- Add server-side validation in page components for actual security
- Use `validateRole()` in all server actions that modify data
- The middleware provides the first layer of defense
- Server components provide the second layer with data access control

## Testing

1. Try accessing `/dashboard/admin` without admin role
2. Try intercepting API calls with modified cookies
3. Disable JavaScript and attempt to access protected routes
4. All should redirect to `/unauthorized` or `/signin`
