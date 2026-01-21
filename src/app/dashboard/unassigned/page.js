"use client";

import { useAuth } from "@/lib/AuthContext";
import LogoutButton from "@/components/LogoutButton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UnassignedDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/signin");
        }
    }, [user, loading, router]);

    if (loading) return null;

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-[#E0E0E0] max-w-md w-full">
                <div className="w-16 h-16 bg-[#F4C430] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-[#C5B358]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-[#003366] mb-4">Well, we are sorry...</h1>
                <p className="text-[#555] mb-8">
                    It seems that you haven't been assigned any roles yet by the coordinator. Please contact your Advisor for more details.
                </p>
                <div className="flex justify-center">
                    <LogoutButton />
                </div>
            </div>
        </div>
    );
}