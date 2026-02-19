"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getPortalTitle } from "@/lib/sidebarConfig";
import { Icons } from "./Icons";
import ProfileDialog from "./ProfileDialog";

export default function Navbar({ role, title, onMenuClick, isCollapsed }) {
    const { user } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Use custom title or derive from role
    const displayTitle = title || getPortalTitle(role);

    return (
        <>
            <ProfileDialog
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                currentRole={role}
            />
            <header className="h-16 bg-[#252D63] text-white flex items-center justify-between px-3 sm:px-4 md:px-8 sticky top-0 z-10 shadow-lg">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    {/* Mobile menu button */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate">{displayTitle}</h1>
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                    {/* Notification Bell */}
                    <button className="hover:bg-white/10 p-2 rounded-lg transition-colors relative">
                        <Icons.Notifications />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#252D63]"></span>
                    </button>

                    {/* User info (hidden on mobile) */}
                    {/* <div
                        onClick={() => setIsProfileOpen(true)}
                        className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-all"
                    >
                        <span className="text-sm text-white/70">{user?.name?.split(" ")[0]}</span>
                        {user?.profile_url ? (
                            <img
                                src={user.profile_url}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
                            />
                        ) : (
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                                {user?.name?.charAt(0) || "U"}
                            </div>
                        )}
                    </div> */}
                </div>
            </header>
        </>
    );
}
