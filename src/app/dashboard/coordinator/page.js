"use client";

import RoleProtected from "@/components/RoleProtected";
import LogoutButton from "@/components/LogoutButton";
import { useAuth } from "@/lib/AuthContext";

export default function CoordinatorDashboard() {
    const { user } = useAuth();

    return (
        <RoleProtected allowedRoles={["coordinator"]}>
            <div className="min-h-screen bg-[#F8F9FA]">
                <nav className="bg-white border-b border-[#E0E0E0] px-6 py-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-[#003366]">Coordinator Portal</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[#2B2B2B] hidden md:block">
                            {user?.name || "Coordinator"}
                        </span>
                        <LogoutButton />
                    </div>
                </nav>

                <main className="container mx-auto px-6 py-8">
                    <h2 className="text-2xl font-bold text-[#003366] mb-4">Event Coordination</h2>
                    <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-8">
                        <p>Review student requests and manage department events.</p>
                    </div>
                </main>
            </div>
        </RoleProtected>
    );
}