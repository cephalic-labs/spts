"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Icons } from "@/components/layout";
import { getRoleDisplayName } from "@/lib/sidebarConfig";
import { getODStats } from "@/lib/services/odRequestService";
import { getEventStats } from "@/lib/services/eventService";
// Chart.js imports
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

export default function DefaultDashboardContent({ role }) {
    const { user } = useAuth();
    const displayName = getRoleDisplayName(role);
    const [stats, setStats] = useState({
        events: 0,
        submissions: 0,
        pending: 0,
        approved: 0,
        rejected: 0 // Adding rejected for comprehensive charts
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
                    events: eventData.total || 0,
                    submissions: odData.total || 0,
                    pending: odData.pending || 0,
                    approved: odData.approved || 0,
                    rejected: Math.max(0, (odData.total || 0) - (odData.pending || 0) - (odData.approved || 0))
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
                    statsColors: ["text-indigo-600", "text-purple-600", "text-fuchsia-600", "text-pink-600"],
                    themeColor: "indigo"
                };
            case 'admin':
                return {
                    bgGradient: "from-slate-800 via-slate-700 to-slate-900",
                    greeting: "System Overview",
                    emoji: "⚙️",
                    primaryAction: "Manage Users",
                    statsColors: ["text-slate-600", "text-gray-700", "text-zinc-600", "text-neutral-600"],
                    themeColor: "slate"
                };
            case 'mentor':
            case 'advisor':
            case 'coordinator':
                return {
                    bgGradient: "from-blue-600 via-cyan-600 to-teal-500",
                    greeting: "Empowering Students",
                    emoji: "🌟",
                    primaryAction: "Review Pending",
                    statsColors: ["text-blue-600", "text-cyan-600", "text-teal-600", "text-sky-600"],
                    themeColor: "cyan"
                };
            case 'hod':
            case 'principal':
                return {
                    bgGradient: "from-emerald-600 via-green-600 to-teal-700",
                    greeting: "Institution Overview",
                    emoji: "🏛️",
                    primaryAction: "View Dashboard",
                    statsColors: ["text-emerald-600", "text-green-600", "text-teal-600", "text-lime-600"],
                    themeColor: "emerald"
                };
            default:
                return {
                    bgGradient: "from-blue-500 to-indigo-600",
                    greeting: "Welcome back!",
                    emoji: "👋",
                    primaryAction: "View Dashboard",
                    statsColors: ["text-blue-500", "text-indigo-500", "text-violet-500", "text-purple-500"],
                    themeColor: "blue"
                };
        }
    };

    const config = getRoleConfig();

    // Chart Data Configs
    const doughnutData = {
        labels: ['Approved', 'Pending', 'Rejected/Other'],
        datasets: [
            {
                data: [stats.approved, stats.pending, stats.rejected],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)', // Emerald 500
                    'rgba(245, 158, 11, 0.8)', // Amber 500
                    'rgba(239, 68, 68, 0.8)',  // Red 500
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 2,
                hoverOffset: 4
            },
        ],
    };

    // Simulated timeline data for the bar chart
    const monthlyDataStructure = [0, 0, 0, Math.floor(stats.submissions * 0.2), Math.floor(stats.submissions * 0.5), Math.floor(stats.submissions * 0.3), stats.submissions];
    const eventsTimelineData = [0, Math.floor(stats.events * 0.1), Math.floor(stats.events * 0.2), Math.floor(stats.events * 0.4), Math.floor(stats.events * 0.2), Math.floor(stats.events * 0.1), 0];

    const barData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
            {
                label: 'Submissions',
                data: monthlyDataStructure,
                backgroundColor: 'rgba(99, 102, 241, 0.7)', // Indigo
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1,
                borderRadius: 4,
            },
            {
                label: 'Active Events',
                data: eventsTimelineData,
                backgroundColor: 'rgba(20, 184, 166, 0.7)', // Teal
                borderColor: 'rgba(20, 184, 166, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }
        ],
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            }
        }
    };

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

            {/* PowerBI-Style Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart Activity Area */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-800">
                                {role === 'student' ? "My Participation History" : "Submission Activity"}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Monthly breakdown of events & submissions</p>
                        </div>
                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <Icons.Refresh />
                        </button>
                    </div>

                    <div className="flex-1 min-h-[300px] w-full relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <Bar
                                data={barData}
                                options={{
                                    ...commonOptions,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            grid: { color: 'rgba(200, 200, 200, 0.1)' }
                                        },
                                        x: {
                                            grid: { display: false }
                                        }
                                    },
                                    plugins: {
                                        ...commonOptions.plugins,
                                        tooltip: {
                                            mode: 'index',
                                            intersect: false,
                                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                            titleFont: { size: 13 },
                                            bodyFont: { size: 13 },
                                            padding: 10,
                                            cornerRadius: 8,
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Doughnut Breakdown */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold tracking-tight text-slate-800">
                            Status Breakdown
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Current submission distribution</p>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center min-h-[250px]">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : stats.submissions === 0 ? (
                            <div className="text-center text-slate-400">
                                <div className="text-4xl mb-2 flex justify-center opacity-50"><Icons.Submissions /></div>
                                <p>No data to display</p>
                            </div>
                        ) : (
                            <>
                                <Doughnut
                                    data={doughnutData}
                                    options={{
                                        ...commonOptions,
                                        cutout: '70%',
                                        plugins: {
                                            ...commonOptions.plugins,
                                            tooltip: {
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                callbacks: {
                                                    label: function (context) {
                                                        const label = context.label || '';
                                                        const value = context.parsed || 0;
                                                        const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                                                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                                        return ` ${label}: ${value} (${percentage}%)`;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                                {/* Center text for doughnut */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8 text-slate-800">
                                    <span className="text-3xl font-black">{stats.submissions}</span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Total</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800">Recent {role === 'student' ? 'Activity' : 'Approvals'}</h3>
                        <button className="text-xs font-semibold text-indigo-600">View All</button>
                    </div>
                    <div className="space-y-4">
                        {[1, 2].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Icons.Dashboard />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-slate-800">System Activity Noted</h4>
                                    <p className="text-xs text-slate-500">Activity registered on the student portal.</p>
                                </div>
                                <span className="text-xs text-slate-400">2h ago</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
                        <div className="w-24 h-24">
                            <Icons.Events />
                        </div>
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <h3 className="text-xl font-bold mb-2">Quick Actions</h3>
                            <p className="text-slate-400 text-sm mb-6">Access your most frequently used tools here.</p>
                        </div>
                        <button className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium backdrop-blur-sm transition-all flex items-center justify-between group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <span>{config.primaryAction}</span>
                            <span className="translate-x-0 group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </button>
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

            <div className={`absolute -bottom-4 -right-4 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity duration-300 group-hover:scale-110 ${colorClass}`}>
                {icon}
            </div>
        </div>
    );
}
