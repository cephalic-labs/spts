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
            <h1 className="text-xl font-semibold">{displayTitle}</h1>

            <div className="flex items-center gap-6">
                <button className="hover:bg-white/10 p-2 rounded-lg transition-colors relative group">
                    <Icons.Notifications />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#252D63]"></span>
                </button>
            </div>
        </header>
    );
}
