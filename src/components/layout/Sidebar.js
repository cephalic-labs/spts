"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { sidebarConfig, getRoleDisplayName } from "@/lib/sidebarConfig";
import { Icons } from "./Icons";
import LogoutButton from "../LogoutButton";
import ProfileDialog from "./ProfileDialog";

export default function Sidebar({ role, isOpen, onClose, isCollapsed, onToggleCollapse }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Get navigation items for the current role
    const navItems = sidebarConfig[role] || [];

    // Get the icon component by name
    const getIcon = (iconName) => {
        const IconComponent = Icons[iconName];
        return IconComponent ? <IconComponent /> : null;
    };

    const desktopWidthClass = isCollapsed ? "lg:w-20" : "lg:w-64";

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          bg-[#1E2761] text-white flex flex-col fixed h-full z-40 shadow-xl
          transition-all duration-300 ease-in-out
          w-64 ${desktopWidthClass}
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
            >
                {/* Logo Section */}
                <div className={`p-4 flex items-center gap-3 border-b border-white/5 ${isCollapsed ? "justify-center" : ""}`}>
                    <img src="/sece_emblem.webp" alt="Logo" className="w-10 h-10 object-contain flex-shrink-0" />
                    {!isCollapsed && (
                        <h2 className="text-xs font-bold leading-tight">Student Participation Tracker</h2>
                    )}
                </div>

                {/* User Profile Section */}
                <div
                    onClick={() => setIsProfileOpen(true)}
                    className={`px-4 py-6 flex flex-col items-center border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors group relative ${isCollapsed ? "py-4" : ""}`}
                >
                    <div className={`bg-white/20 rounded-full flex items-center justify-center text-white font-bold border border-white/30 overflow-hidden transition-all group-hover:scale-105 group-hover:border-white/50 ${isCollapsed ? "w-10 h-10 text-sm" : "w-12 h-12 text-lg mb-2"}`}>
                        {user?.profile_url ? (
                            <img
                                src={user.profile_url}
                                alt={user?.name || "User profile"}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span>{(user?.name || role || "U")[0].toUpperCase()}</span>
                        )}
                    </div>
                    {!isCollapsed && (
                        <>
                            <h3 className="font-bold text-sm mb-0.5 text-center truncate w-full group-hover:text-amber-400 transition-colors">
                                {user?.name || getRoleDisplayName(role)}
                            </h3>
                            <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-white/10 rounded-md text-[9px] font-black tracking-[0.1em] text-white/70 uppercase group-hover:bg-white/20 transition-colors">
                                    {role}
                                </span>
                                {(Array.isArray(user?.role) && user.role.length > 1) && (
                                    <svg className="w-3 h-3 text-white/40 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <ProfileDialog
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    currentRole={role}
                />

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                href={item.path}
                                onClick={onClose}
                                title={isCollapsed ? item.name : undefined}
                                className={`
                  w-full flex items-center gap-3 py-3 text-sm font-medium transition-all group
                  ${isCollapsed ? "justify-center px-2" : "px-6"}
                  ${isActive
                                        ? "bg-[#3D4CAB] text-white shadow-inner border-r-[4px] border-white"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                    }
                `}
                            >
                                <span className={`flex-shrink-0 ${isActive ? "text-white" : "text-white/40 group-hover:text-white"}`}>
                                    {getIcon(item.icon)}
                                </span>
                                {!isCollapsed && <span className="truncate">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse Toggle (Desktop only) */}
                <div className="hidden lg:block p-2 border-t border-white/5">
                    <button
                        onClick={onToggleCollapse}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold transition-all"
                    >
                        <svg className={`w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                        {!isCollapsed && <span>Collapse</span>}
                    </button>
                </div>

                {/* Logout Button */}
                <div className="p-2 border-t border-white/5">
                    <LogoutButton className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 text-xs font-bold transition-all border border-white/10 ${isCollapsed ? "px-2" : ""}`} />
                </div>
            </aside>
        </>
    );
}
