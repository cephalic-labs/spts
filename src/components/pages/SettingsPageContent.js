"use client";

import { useAuth } from "@/lib/AuthContext";
import { Icons } from "@/components/layout";

export default function SettingsPageContent({ role }) {
    const { user } = useAuth();

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#1E2761]">Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-50 flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm relative group">
                        <img
                            src={user?.profile_url || "https://randomuser.me/api/portraits/thumb/men/93.jpg"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#1E2761]">{user?.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-[#1E2761] text-white text-[10px] font-bold rounded uppercase tracking-wider">
                                {role}
                            </span>
                            <span className="text-gray-400 text-sm font-medium">{user?.email}</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-gray-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
                                <input
                                    type="text"
                                    defaultValue={user?.name}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E2761]/10 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                                <input
                                    type="email"
                                    defaultValue={user?.email}
                                    disabled
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-400 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                <h4 className="text-blue-900 font-bold text-sm mb-2 flex items-center gap-2">
                                    <Icons.Dashboard /> Security Note
                                </h4>
                                <p className="text-blue-700 text-xs leading-relaxed">
                                    Account security is managed via Appwrite Auth. Contact IT if you need to change your primary authentication method or password.
                                </p>
                            </div>

                            <button className="w-full bg-[#1E2761] text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-[#1E2761]/20 hover:scale-[1.02] transition-transform">
                                Update Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
