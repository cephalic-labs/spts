"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getRoleDisplayName } from "@/lib/sidebarConfig";

export default function ProfileDialog({ isOpen, onClose, currentRole }) {
    const { user, logout } = useAuth();
    const router = useRouter();

    if (!isOpen) return null;

    // Ensure roles is an array
    const availableRoles = Array.isArray(user?.role)
        ? user.role
        : (user?.role ? [user.role] : []);

    // Also include labels if for some reason DB role sync failed but labels exist
    // (Optional resilience step, typically DB role is best)
    // For now, relies on user.role from AuthContext which comes from DB

    const handleSwitchRole = (role) => {
        router.push(`/dashboard/${role.toLowerCase()}`);
        onClose();
    };

    const handleLogout = async () => {
        await logout();
        router.push("/signin");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-[#1E2761] p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 p-1 shadow-lg ring-4 ring-white/10">
                        <img
                            src={user?.profile_url || `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=random`}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                    <h3 className="text-xl font-bold">{user?.name}</h3>
                    <p className="text-white/60 text-sm mt-1">{user?.email}</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Switch Role</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {availableRoles.length > 0 ? (
                                availableRoles.map((role) => {
                                    const isActive = role.toLowerCase() === currentRole.toLowerCase();
                                    return (
                                        <button
                                            key={role}
                                            onClick={() => handleSwitchRole(role)}
                                            disabled={isActive}
                                            className={`
                                                w-full flex items-center justify-between p-3 rounded-xl border transition-all
                                                ${isActive
                                                    ? "bg-blue-50 border-blue-200 cursor-default"
                                                    : "bg-white border-gray-100 hover:border-[#1E2761]/30 hover:shadow-md active:scale-[0.98]"
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold uppercase
                                                    ${isActive ? "bg-blue-200 text-[#1E2761]" : "bg-gray-100 text-gray-500"}
                                                `}>
                                                    {role.substring(0, 2)}
                                                </div>
                                                <div className="text-left">
                                                    <div className={`font-bold text-sm ${isActive ? "text-[#1E2761]" : "text-gray-700"}`}>
                                                        {getRoleDisplayName(role)}
                                                    </div>
                                                </div>
                                            </div>
                                            {isActive && (
                                                <div className="px-2 py-1 bg-[#1E2761] text-white text-[10px] font-bold uppercase rounded tracking-wider">
                                                    Current
                                                </div>
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-gray-500 text-center italic py-2">No roles assigned</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full py-3 border border-red-100 text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
