"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Icons } from "@/components/layout";
import StatCard from "@/components/ui/StatCard";
import { getEventStats } from "@/lib/services/eventService";
import { getODStats } from "@/lib/services/odRequestService";
import { getStudentStats } from "@/lib/services/studentService";

export default function SudoDashboardContent() {
    const { user } = useAuth();
    const [statsData, setStatsData] = useState({
        totalEvents: 0,
        activeEvents: 0,
        totalSubmissions: 0,
        pendingApprovals: 0,
        approvedTotal: 0,
        totalStudents: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAllStats() {
            try {
                setLoading(true);
                const [eventStats, odStats, studentStats] = await Promise.all([
                    getEventStats(),
                    getODStats(),
                    getStudentStats()
                ]);

                setStatsData({
                    totalEvents: eventStats.total,
                    activeEvents: eventStats.total, // For now assuming all are active
                    totalSubmissions: odStats.total,
                    pendingApprovals: odStats.pending,
                    approvedTotal: odStats.approved,
                    totalStudents: studentStats.total
                });
            } catch (error) {
                console.error("Error fetching sudo dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAllStats();
    }, []);

    const stats = [
        { value: loading ? "--" : statsData.totalEvents, label: "Total Events", icon: <Icons.Events />, color: { bg: "bg-blue-600", text: "text-white" } },
        { value: loading ? "--" : statsData.activeEvents, label: "Active Events", icon: <Icons.Events />, color: { bg: "bg-emerald-600", text: "text-white" } },
        { value: loading ? "--" : statsData.totalSubmissions, label: "Total Submissions", icon: <Icons.Submissions />, color: { bg: "bg-emerald-700", text: "text-white" } },
        { value: loading ? "--" : statsData.pendingApprovals, label: "Pending Approvals", icon: <Icons.Approvals />, color: { bg: "bg-orange-500", text: "text-white" } },
        { value: loading ? "--" : statsData.approvedTotal, label: "Approved", icon: <Icons.Approvals />, color: { bg: "bg-green-600", text: "text-white" } },
        { value: loading ? "--" : statsData.totalStudents, label: "Total Students", icon: <Icons.Students />, color: { bg: "bg-purple-600", text: "text-white" } },
    ];

    return (
        <>
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-4xl font-black text-[#1E2761] flex items-center gap-3 tracking-tight">
                        System Dashboard, {user?.name?.split(" ")[0]} <span className="animate-bounce">🚀</span>
                    </h1>
                    <div className="mt-3 flex items-center gap-3">
                        <div className="bg-[#1E2761] text-white text-[10px] font-black px-3 py-1 rounded shadow-sm tracking-wider uppercase">
                            Role: {user?.labels?.[0]}
                        </div>
                        <div className="text-gray-400 text-sm font-medium border-l border-gray-200 pl-3">
                            Full system overview and control
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-[#3E7BCB] font-bold text-[11px] uppercase tracking-widest transition-all shadow-sm active:scale-95"
                    >
                        <Icons.Refresh />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                {stats.map((stat, idx) => (
                    <StatCard key={idx} {...stat} />
                ))}
            </div>

            {/* Participation Table - Still Placeholder for now */}
            <section className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden mb-10">
                <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-[#1E2761]">Participation & Prize by Class</h2>
                        <p className="text-gray-400 text-sm font-medium mt-1">Real-time participation metrics by academic year</p>
                    </div>
                </div>
                <div className="overflow-x-auto min-h-[200px]">
                    <table className="w-full text-left">
                        <thead className="bg-[#F8F9FA]">
                            <tr>
                                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Class</th>
                                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Participated</th>
                                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Prize (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan="3" className="px-8 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-2">
                                            <Icons.Submissions />
                                        </div>
                                        <p className="text-gray-400 font-bold text-sm">Detailed class analytics coming soon</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Bottom Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                <div className="bg-gradient-to-br from-[#00BCD4] to-[#0097A7] rounded-3xl p-10 text-white relative overflow-hidden shadow-xl">
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                <Icons.Dashboard />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">Real-Time Analytics</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-10">
                            <div>
                                <div className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-3">Live Connections</div>
                                <div className="text-6xl font-black tracking-tighter">1</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-3">Recent Activity</div>
                                <div className="text-6xl font-black tracking-tighter">{statsData.totalSubmissions}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-[#7986CB] to-[#5C6BC0] rounded-3xl p-10 text-white relative overflow-hidden shadow-xl">
                    <div className="relative z-10 text-center flex flex-col items-center justify-center h-full">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                <Icons.Reports />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">System Health</h3>
                        </div>
                        <div className="mt-6">
                            <div className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-4">Database Status</div>
                            <div className="text-4xl font-black tracking-tighter mb-2">ONLINE</div>
                            <div className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-bold">Appwrite Connected</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
