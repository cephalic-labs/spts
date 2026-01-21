"use client";

import RoleProtected from "@/components/RoleProtected";
import LogoutButton from "@/components/LogoutButton";
import { useAuth } from "@/lib/AuthContext";

export default function HodDashboard() {
    const { user } = useAuth();

    return (
        <RoleProtected allowedRoles={["hod"]}>
            <div className="min-h-screen bg-[#F8F9FA]">
                <nav className="bg-white border-b border-[#E0E0E0] px-6 py-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-[#003366]">HOD Portal</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[#2B2B2B] hidden md:block">
                            Welcome, {user?.name.split(" ")[0] || "HOD"}
                        </span>
                        <LogoutButton />
                    </div>
                </nav>

                <main className="container mx-auto px-6 py-8">
                    <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-8 text-center">
                        <h2 className="text-2xl font-bold text-[#003366] mb-4">
                            Welcome to your Dashboard
                        </h2>
                        <p className="text-[#555]">
                            You have successfully authenticated as a HOD.
                        </p>
                    </div>
                </main>
            </div>
        </RoleProtected>
    );
}