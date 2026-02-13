"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getPortalTitle, getRoleDisplayName } from "@/lib/sidebarConfig";
import { Icons } from "./Icons";

export default function Navbar({ role, title, onMenuClick, isCollapsed }) {
    const { user } = useAuth();
    const [showRoleDialog, setShowRoleDialog] = useState(false);

    // Role switching logic
    const availableRoles = user?.roles || [];
    const hasMultipleRoles = availableRoles.length > 1;

    console.log("Navbar Debug:", {
        userRoles: user?.roles,
        availableRoles,
        hasMultipleRoles,
        currentRole: role
    });

    // Use custom title or derive from role
    const displayTitle = title || getPortalTitle(role);

    return (
        <>
            {/* Role Switcher Dialog */}
            {showRoleDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowRoleDialog(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-black text-[#1E2761]">Switch Portal</h3>
                            <p className="text-sm text-gray-500">Select another role to view</p>
                        </div>
                        <div className="p-2 space-y-1 max-h-[60vh] overflow-y-auto">
                            {availableRoles.map(r => (
                                <Link
                                    key={r}
                                    href={`/dashboard/${r}`}
                                    onClick={() => setShowRoleDialog(false)}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${role === r
                                        ? 'border-[#1E2761] bg-blue-50/50 shadow-sm'
                                        : 'border-transparent hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${role === r ? 'bg-[#1E2761]' : 'bg-gray-300 group-hover:bg-gray-400'}`}></div>
                                        <span className={`font-bold capitalize ${role === r ? 'text-[#1E2761]' : 'text-gray-600'}`}>{getRoleDisplayName(r)}</span>
                                    </div>
                                    {role === r && <span className="text-xs font-bold text-[#1E2761] bg-white px-2 py-1 rounded-md shadow-sm border border-blue-100">Current</span>}
                                </Link>
                            ))}
                        </div>
                        <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                            <button onClick={() => setShowRoleDialog(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

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
                    {/* User info (hidden on mobile) */}
                    <div
                        className={`hidden md:flex items-center gap-3 ${hasMultipleRoles ? 'cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors' : ''}`}
                        onClick={() => {
                            console.log("Profile clicked. multiple roles?", hasMultipleRoles);
                            if (hasMultipleRoles) setShowRoleDialog(true);
                        }}
                    >
                        <div className="flex flex-col items-end">
                            <span className="text-sm text-white/90 font-medium">{user?.name?.split(" ")[0]}</span>
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{getRoleDisplayName(role)}</span>
                        </div>
                        {user?.profile_url ? (
                            <img
                                src={user.profile_url}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white/20 shadow-sm"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm border-2 border-white/20">
                                {user?.name?.charAt(0) || "U"}
                            </div>
                        )}
                        {hasMultipleRoles && (
                            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}
