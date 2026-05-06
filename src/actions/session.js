"use server";

import { cookies } from "next/headers";

export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(
      `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    );

    if (!sessionCookie) {
      return { user: null, error: "No session found" };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/account`,
      {
        headers: {
          "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
          Cookie: `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}=${sessionCookie.value}`,
        },
      }
    );

    if (!response.ok) {
      return { user: null, error: "Invalid session" };
    }

    const user = await response.json();
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
}

export async function validateRole(allowedRoles = []) {
  const { user, error } = await getServerSession();

  if (error || !user) {
    return { authorized: false, user: null, error: error || "Unauthorized" };
  }

  const userLabels = user.labels?.length > 0 ? user.labels : ["unassigned"];
  const hasPermission = allowedRoles.some((role) => userLabels.includes(role));

  return {
    authorized: hasPermission,
    user,
    error: hasPermission ? null : "Insufficient permissions",
  };
}
