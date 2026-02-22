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

    // UI Configuration based on role
    const getRoleConfig = () => {
        switch (role) {
            case 'student':
                return {
                    bgGradient: "from-indigo-600 via-purple-600 to-fuchsia-600",
                    greeting: "Ready to learn?",
                    emoji: "🎓",
                    primaryAction: "Browse Events",
                    statsColors: ["text-indigo-600", "text-purple-600", "text-fuchsia-600", "text-pink-600"]
                };
            case 'admin':
                return {
                    bgGradient: "from-slate-800 via-slate-700 to-slate-900",
                    greeting: "System Overview",
                    emoji: "⚙️",
                    primaryAction: "Manage Users",
                    statsColors: ["text-slate-600", "text-gray-700", "text-zinc-600", "text-neutral-600"]
                };
            case 'mentor':
            case 'advisor':
            case 'coordinator':
                return {
                    bgGradient: "from-blue-600 via-cyan-600 to-teal-500",
                    greeting: "Empowering Students",
                    emoji: "🌟",
                    primaryAction: "Review Pending",
                    statsColors: ["text-blue-600", "text-cyan-600", "text-teal-600", "text-sky-600"]
                };
            case 'hod':
            case 'principal':
                return {
                    bgGradient: "from-emerald-600 via-green-600 to-teal-700",
                    greeting: "Institution Overview",
                    emoji: "🏛️",
                    primaryAction: "View Dashboard",
                    statsColors: ["text-emerald-600", "text-green-600", "text-teal-600", "text-lime-600"]
                };
            default:
                return {
                    bgGradient: "from-blue-500 to-indigo-600",
                    greeting: "Welcome back!",
                    emoji: "👋",
                    primaryAction: "View Dashboard",
                    statsColors: ["text-blue-500", "text-indigo-500", "text-violet-500", "text-purple-500"]
                };
        }
    };

    const config = getRoleConfig();

    return (
        <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${config.bgGradient} p-8 sm:p-12 shadow-2xl shadow-indigo-200/50`}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white/90 text-xs font-semibold tracking-wider font-mono mb-4 backdrop-blur-sm border border-white/20">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            {displayName.toUpperCase()} PORTAL
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
                            Hello, {user?.name?.split(" ")[0] || "User"} {config.emoji}
                        </h1>
                        <p className="text-white/80 text-lg sm:text-xl font-medium max-w-xl">
                            {config.greeting} Here is what is happening today.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Events"
                    value={loading ? "..." : stats.events}
                    icon={<Icons.Events />}
                    colorClass={config.statsColors[0]}
                    delay="0"
                />
                <StatCard
                    title={role === 'student' ? "My Submissions" : "Total Submissions"}
                    value={loading ? "..." : stats.submissions}
                    icon={<Icons.Submissions />}
                    colorClass={config.statsColors[1]}
                    delay="100"
                />
                <StatCard
                    title={role === 'student' ? "Pending Approval" : "Requires Review"}
                    value={loading ? "..." : stats.pending}
                    icon={<Icons.Approvals />}
                    colorClass={config.statsColors[2]}
                    delay="200"
                    alert={stats.pending > 0 && role !== 'student'}
                />
                <StatCard
                    title="Approved"
                    value={loading ? "..." : stats.approved}
                    icon={<Icons.Certificate />}
                    colorClass={config.statsColors[3]}
                    delay="300"
                />
            </div>

            {/* Dashboard Specific Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Action Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold tracking-tight text-slate-800">
                                {role === 'student' ? "My Recent Activity" : "Recent Submissions"}
                            </h2>
                            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                                View All &rarr;
                            </button>
                        </div>

                        {/* Placeholder for Timeline / List */}
                        <div className="divide-y divide-slate-100">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="py-4 flex gap-4 items-start group">
                                    <div className="mt-1 bg-slate-50 p-3 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors text-slate-400">
                                        <Icons.Dashboard />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800 group-hover:text-indigo-900 transition-colors duration-300">
                                            {role === 'student' ? "Dashboard Checked" : "System Notification"}
                                        </h4>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {role === 'student' ? "You successfully logged into your student portal." : "There are new activities pending your review."}
                                        </p>
                                        <span className="text-xs font-medium text-slate-400 mt-2 block">Just now</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar area for widgets */}
                <div className="space-y-8">
                    {/* Action Card based on role */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
                            <div className="w-24 h-24">
                                <Icons.Events />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-2">Quick Actions</h3>
                            <p className="text-slate-400 text-sm mb-6">Access your most frequently used tools directly from here.</p>

                            <button className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium backdrop-blur-sm transition-all flex items-center justify-between group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                <span>{config.primaryAction}</span>
                                <span className="translate-x-0 group-hover:translate-x-1 transition-transform">&rarr;</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Info Card */}
                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4">System Notice</h3>
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-sm flex gap-3 shadow-sm shadow-amber-100/50">
                            <span className="text-xl">🔔</span>
                            <p className="leading-relaxed">Keep up the good work! Make sure to stay updated with your latest alerts.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, colorClass, delay, alert }) {
    return (
        <div style={{ animationDelay: `${delay}ms` }} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group cursor-default">
            {alert && (
                <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            )}
            {alert && (
                <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full"></div>
            )}
            <div className="flex items-center justify-between mb-4">
                <div className={`p-4 rounded-2xl bg-slate-50 transition-colors duration-300 group-hover:bg-slate-100 ${colorClass}`}>
                    {icon}
                </div>
            </div>
            <div>
                <div className="text-3xl font-black text-slate-800 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
                    {value}
                </div>
                <div className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wider">{title}</div>
            </div>

            {/* Decorative background icon */}
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity duration-300 group-hover:scale-110 ${colorClass}`}>
                {icon}
            </div>
        </div>
    );
}
