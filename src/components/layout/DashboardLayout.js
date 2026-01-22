"use client";

import RoleProtected from "../RoleProtected";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ children, role, allowedRoles, title }) {
    // If allowedRoles is not provided, use the role as the only allowed role
    const roles = allowedRoles || [role];

    return (
        <RoleProtected allowedRoles={roles}>
            <div className="min-h-screen bg-[#F8F9FA] flex">
                {/* Sidebar */}
                <Sidebar role={role} />

                {/* Main Content Area */}
                <div className="flex-1 ml-64 flex flex-col min-h-screen">
                    {/* Navbar */}
                    <Navbar role={role} title={title} />

                    {/* Page Content */}
                    <main className="p-10 max-w-7xl mx-auto w-full flex-1">
                        {children}
                    </main>
                </div>
            </div>
        </RoleProtected>
    );
}
