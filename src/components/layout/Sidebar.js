"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { sidebarConfig, getRoleDisplayName } from "@/lib/sidebarConfig";
import { Icons } from "./Icons";
import LogoutButton from "../LogoutButton";

export default function Sidebar({ role }) {
    const { user } = useAuth();
    const pathname = usePathname();

    // Get navigation items for the current role
    const navItems = sidebarConfig[role] || [];

    // Get the icon component by name
    const getIcon = (iconName) => {
        const IconComponent = Icons[iconName];
        return IconComponent ? <IconComponent /> : null;
    };

    return (
        <aside className="w-64 bg-[#1E2761] text-white flex flex-col fixed h-full z-20 shadow-xl">
            {/* Logo Section */}
            <div className="p-6 flex items-center gap-3 border-b border-white/5">
                <img src="/sece_emblem.webp" alt="Logo" className="w-12 h-12 object-contain" />
                <h2 className="text-sm font-bold leading-tight">Student Participation Tracker</h2>
            </div>

            {/* User Profile Section */}
            <div className="px-6 py-8 flex flex-col items-center border-b border-white/5">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 border border-white/30 overflow-hidden">
                    {user?.image ? (
                        <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        user?.name?.[0] || "U"
                    )}
                </div>
                <h3 className="font-bold text-base mb-0.5">{user?.name || getRoleDisplayName(role)}</h3>
                <span className="px-2 py-0.5 bg-white/10 rounded-md text-[9px] font-black tracking-[0.1em] text-white/70 uppercase">
                    {role}
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-all group ${isActive
                                    ? "bg-[#3D4CAB] text-white shadow-inner border-r-[4px] border-white"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <span className={`${isActive ? "text-white" : "text-white/40 group-hover:text-white"}`}>
                                {getIcon(item.icon)}
                            </span>
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-white/5">
                <LogoutButton className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 text-xs font-bold transition-all border border-white/10" />
            </div>
        </aside>
    );
}
