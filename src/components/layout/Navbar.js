"use client";

import { useAuth } from "@/lib/AuthContext";
import { getPortalTitle } from "@/lib/sidebarConfig";
import { Icons } from "./Icons";

export default function Navbar({ role, title }) {
    const { user } = useAuth();

    // Use custom title or derive from role
    const displayTitle = title || getPortalTitle(role);

    return (
        <header className="h-16 bg-[#252D63] text-white flex items-center justify-between px-8 sticky top-0 z-10 shadow-lg">
            {/* Left side - Title */}
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-bold tracking-tight">{displayTitle}</h1>
            </div>

            {/* Right side - Notifications & User Info */}
            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <button className="hover:bg-white/10 p-2 rounded-lg transition-colors relative group">
                    <Icons.Notifications />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#252D63]"></span>
                </button>

                {/* User Info */}
                <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-medium">{user?.name?.split(" ")[0] || "User"}</div>
                        <div className="text-[10px] text-white/50 uppercase tracking-wider">{role}</div>
                    </div>
                    <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold border border-white/30 overflow-hidden">
                        {user?.image ? (
                            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            user?.name?.[0] || "U"
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
