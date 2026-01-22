"use client";

import { useState, useEffect } from "react";
import RoleProtected from "../RoleProtected";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ children, role, allowedRoles, title }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // If allowedRoles is not provided, use the role as the only allowed role
    const roles = allowedRoles || [role];

    // Calculate margin based on sidebar state
    const getMarginClass = () => {
        if (isMobile) return "ml-0";
        return sidebarCollapsed ? "lg:ml-20" : "lg:ml-64";
    };

    return (
        <RoleProtected allowedRoles={roles}>
            <div className="min-h-screen bg-[#F8F9FA] flex">
                {/* Sidebar */}
                <Sidebar
                    role={role}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    isCollapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                />

                {/* Main Content Area */}
                <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${getMarginClass()}`}>
                    {/* Navbar */}
                    <Navbar
                        role={role}
                        title={title}
                        onMenuClick={() => setSidebarOpen(true)}
                        isCollapsed={sidebarCollapsed}
                    />

                    {/* Page Content */}
                    <main className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto w-full flex-1">
                        {children}
                    </main>
                </div>
            </div>
        </RoleProtected>
    );
}
