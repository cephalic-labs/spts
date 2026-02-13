"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RoleProtected({ children, allowedRoles = [] }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push("/signin");
            return;
        }

        // Treat empty labels as "unassigned"
        const userLabels = (user.labels && user.labels.length > 0) ? user.labels : ["unassigned"];
        const hasPermission = allowedRoles.some((role) => userLabels.includes(role));

        if (!hasPermission) {
            // Check if user has legitimate roles but is trying to access a different one
            // vs unassigned user trying to access secure page
            if (userLabels.includes("unassigned")) {
                router.push("/dashboard/unassigned");
            } else {
                router.push("/unauthorized");
            }
        }
    }, [user, loading, router, allowedRoles]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
            </div>
        );
    }

    // Double check to prevent flash before redirect effect runs
    const userLabels = (user?.labels && user.labels.length > 0) ? user.labels : ["unassigned"];
    const hasPermission = allowedRoles.some((role) => userLabels.includes(role));

    if (!user || !hasPermission) {
        return null;
    }

    return <>{children}</>;
}
