"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRouter() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/signin");
      return;
    }

    const label = user.labels && user.labels.length > 0 ? user.labels[0] : null;

    switch (label) {
      case "admin":
        router.push("/dashboard/admin");
        break;
      case "advisor":
        router.push("/dashboard/advisor");
        break;
      case "coordinator":
        router.push("/dashboard/coordinator");
        break;
      case "hod":
        router.push("/dashboard/hod");
        break;
      case "mentor":
        router.push("/dashboard/mentor");
        break;
      case "principal":
        router.push("/dashboard/principal");
        break;
      case "student":
        router.push("/dashboard/student");
        break;
      case "sudo":
        router.push("/dashboard/sudo");
        break;
      default:
        router.push("/dashboard/unassigned");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
    </div>
  );
}