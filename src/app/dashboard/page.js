"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { validRoles } from "@/lib/sidebarConfig";

export default function DashboardRouter() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/signin");
      return;
    }

    const labels = user.labels || [];

    // Find the first label that matches a valid role
    // Also normalize: check lowercase versions
    let matchedRole = null;

    for (const label of labels) {
      const normalizedLabel = label.toLowerCase().trim();
      if (validRoles.includes(normalizedLabel)) {
        matchedRole = normalizedLabel;
        break;
      }
    }

    if (matchedRole) {
      router.push(`/dashboard/${matchedRole}`);
    } else {
      router.push("/dashboard/unassigned");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
    </div>
  );
}