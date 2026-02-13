"use client";

import { useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export default function UnauthorizedPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-[#C94C4C] bg-opacity-20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#C94C4C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-[#003366] mb-2">Access Denied</h1>
            <p className="text-[#555] mb-8 max-w-md">
                You do not have permission to view the requested page. If you believe this is an error, please contact your administrator.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full sm:w-auto px-6 py-2 border border-[#003366] text-[#003366] rounded hover:bg-[#F0F4F8] transition-colors"
                >
                    Go Back
                </button>
                <LogoutButton />
            </div>
        </div>
    )
}
