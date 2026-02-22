"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { updateUserProfile } from "@/lib/services/userService";
import { account } from "@/lib/appwrite";

export default function SettingsPageContent({ role }) {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const handleUpdate = async () => {
        try {
            setSaving(true);
            setMessage(null);

            // Update Appwrite Auth name
            await account.updateName(name);

            // Update database record
            await updateUserProfile(user.dbId, {
                user_name: name
            });

            await refreshUser();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div className="bg-white rounded-[32px] p-6 md:p-10 shadow-sm border border-gray-100 flex flex-col items-center gap-8 transition-all hover:shadow-md">

                {/* Profile Section */}
                <div className="flex flex-col items-center gap-4 w-full border-b border-gray-50 pb-8">
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-[6px] border-white shadow-xl shadow-black/5">
                            <img
                                src={user?.profile_url || "https://randomuser.me/api/portraits/thumb/men/93.jpg"}
                                alt="Profile"
                                className="w-full h-full object-cover transform transition-transform group-hover:scale-110 duration-700 ease-out"
                            />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-[2px]">
                            <svg className="w-8 h-8 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 text-center">
                        <h2 className="text-2xl font-black text-[#1E2761] uppercase tracking-tight leading-none">{user?.name}</h2>
                        <div className="flex items-center gap-2 justify-center">
                            <span className="bg-[#1E2761] text-white text-[10px] font-bold px-2.5 py-1 rounded-[6px] w-fit uppercase tracking-wider shadow-sm shadow-[#1E2761]/20">
                                {role}
                            </span>
                            <span className="text-gray-400 text-xs font-medium tracking-wide break-all text-center">{user?.email}</span>
                        </div>
                    </div>
                </div>

                {/* Form Inputs & Action */}
                <div className="w-full flex flex-col gap-6">

                    {/* Display Name Input */}
                    <div className="space-y-2 w-full">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Display Name</label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-[#1E2761] focus:outline-none focus:ring-4 focus:ring-[#1E2761]/5 focus:border-[#1E2761] transition-all placeholder:font-normal placeholder:text-gray-300 shadow-sm group-hover:border-gray-300"
                                placeholder="Enter display name"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight pl-1">This name will be displayed across your profile and in the system.</p>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2 w-full">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                        <div className="bg-gray-50/80 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium text-gray-400 cursor-not-allowed truncate select-none">
                            {user?.email}
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight pl-1">Email address cannot be changed.</p>
                    </div>

                    {/* Save Button */}
                    {name !== user?.name && (
                        <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <button
                                onClick={handleUpdate}
                                disabled={saving || !name}
                                className="w-full h-[56px] bg-[#1E2761] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-[#1E2761]/20 hover:bg-[#2d3a7d] hover:shadow-xl hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </span>
                                ) : "Save Changes"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {message && (
                <div className={`mt-6 p-4 rounded-2xl text-center text-sm font-bold flex items-center justify-center gap-3 shadow-sm border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'
                    } animate-in fade-in slide-in-from-top-4 duration-500`}>
                    {message.type === 'success' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {message.text}
                </div>
            )}
        </div>
    );
}
