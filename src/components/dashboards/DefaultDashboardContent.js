"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Icons } from "@/components/layout";
import { getRoleDisplayName } from "@/lib/sidebarConfig";
import { getODStats } from "@/lib/services/odRequestService";
import { getEventStats } from "@/lib/services/eventService";

export default function DefaultDashboardContent({ role }) {
    const { user } = useAuth();
    const displayName = getRoleDisplayName(role);
    const [stats, setStats] = useState({
        events: 0,
        submissions: 0,
        pending: 0,
        approved: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true);
                const eventData = await getEventStats();

                // If student, filter by their ID
                const odFilter = role === 'student' ? { student_id: user?.$id || user?.dbId } : {};
                const odData = await getODStats(odFilter);

                setStats({
                    events: eventData.total,
                    submissions: odData.total,
                    pending: odData.pending,
                    approved: odData.approved
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchStats();
        }
    }, [role, user]);

    const getEmoji = (role) => {
        const emojis = {
            admin: "👋",
            student: "🎓",
            mentor: "🌟",
            advisor: "📋",
            coordinator: "🎯",
            hod: "🏫",
            principal: "🎓",
        };
        return emojis[role] || "👋";
    };

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-[#1E2761] mb-2">
                    Welcome, {user?.name?.split(" ")[0] || displayName}! {getEmoji(role)}
                </h1>
                <p className="text-gray-500">Your {displayName.toLowerCase()} dashboard overview.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Icons.Events />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-800">
                                {loading ? "..." : stats.events}
                            </div>
                            <div className="text-sm text-gray-500">Events</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <Icons.Submissions />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-800">
                                {loading ? "..." : stats.submissions}
                            </div>
                            <div className="text-sm text-gray-500">Submissions</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                            <Icons.Approvals />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-800">
                                {loading ? "..." : stats.pending}
                            </div>
                            <div className="text-sm text-gray-500">Pending</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <Icons.Certificate />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-800">
                                {loading ? "..." : stats.approved}
                            </div>
                            <div className="text-sm text-gray-500">Approved</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-[#1E2761] mb-4">Recent Activity</h2>
                <div className="text-center py-12 text-gray-400">
                    <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Icons.Dashboard />
                    </div>
                    <p>Activity data will appear here</p>
                </div>
            </div>
        </>
    );
}
