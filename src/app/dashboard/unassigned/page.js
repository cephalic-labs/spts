"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UnassignedPage() {
    const { user, logout, checkUser } = useAuth();
    const router = useRouter();
    const [checking, setChecking] = useState(false);

    const handleRetryRoleCheck = async () => {
        setChecking(true);
        try {
            await checkUser();
            // After re-checking, redirect to dashboard which will route correctly
            router.push("/dashboard");
        } catch (err) {
            console.error("Error retrying role check:", err);
        } finally {
            setChecking(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push("/signin");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-[#E6E9EE] p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">⏳</span>
                </div>

                <h1 className="text-2xl font-bold text-[#1E2761] mb-3">
                    Account Not Yet Assigned
                </h1>

                <p className="text-gray-500 mb-2">
                    Hello, <span className="font-semibold text-gray-700">{user?.name || "User"}</span>!
                </p>

                <p className="text-gray-500 text-sm mb-6">
                    Your email (<span className="font-mono text-xs text-gray-600">{user?.email}</span>) hasn't been
                    matched to a student or faculty record yet. This usually means:
                </p>

                <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <p>Your profile hasn't been added to the system by an admin</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <p>The email in your Google account doesn't match the one in your records</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <p>Your records are being processed and will be available soon</p>
                    </div>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                    Contact your <span className="font-semibold">class advisor</span> or{" "}
                    <span className="font-semibold">coordinator</span> to resolve this.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleRetryRoleCheck}
                        disabled={checking}
                        className="w-full px-6 py-3 bg-[#1E2761] text-white font-bold rounded-xl hover:bg-[#2d3a7d] transition-all disabled:opacity-50"
                    >
                        {checking ? "Checking..." : "🔄 Check Again"}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}