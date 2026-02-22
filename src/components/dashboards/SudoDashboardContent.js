"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Icons } from "@/components/layout";
import { getEventStats, getEvents } from "@/lib/services/eventService";
import { getODStats, getAllODRequests } from "@/lib/services/odRequestService";
import { getStudentStats } from "@/lib/services/studentService";
import { format, subDays, parseISO, startOfDay } from "date-fns";
import { databases } from "@/lib/appwrite";
import { DB_CONFIG } from "@/lib/dbConfig";
import { Query } from "appwrite";

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

export default function SudoDashboardContent() {
    const { user } = useAuth();
    const [statsData, setStatsData] = useState({
        totalEvents: 0,
        activeEvents: 0,
        totalSubmissions: 0,
        pendingApprovals: 0,
        approvedTotal: 0,
        rejectedTotal: 0,
        totalStudents: 0,
        totalFaculty: 0,
        totalAdmins: 0,
        totalSudo: 0
    });
    const [loading, setLoading] = useState(true);

    const [chartData, setChartData] = useState({
        lineChart: { current: [], previous: [], labels: [] },
        demand: { labels: [], data: [] },
        stacked: { labels: [], accepted: [], rejected: [], pending: [] }
    });

    useEffect(() => {
        async function fetchAllStats() {
            try {
                setLoading(true);
                const [eventStats, odStats, studentStats, facultiesRes, adminsRes, sudosRes] = await Promise.all([
                    getEventStats(),
                    getODStats(),
                    getStudentStats(),
                    databases.listDocuments(DB_CONFIG.DATABASE_ID, DB_CONFIG.COLLECTIONS.FACULTIES, [Query.limit(1)]),
                    databases.listDocuments(DB_CONFIG.DATABASE_ID, DB_CONFIG.COLLECTIONS.USERS, [Query.equal("role", "admin"), Query.limit(1)]),
                    databases.listDocuments(DB_CONFIG.DATABASE_ID, DB_CONFIG.COLLECTIONS.USERS, [Query.equal("role", "sudo"), Query.limit(1)]),
                ]);

                let totalSub = odStats.total || 0;
                let pending = odStats.pending || 0;
                let approved = odStats.approved || 0;
                let rejected = Math.max(0, totalSub - pending - approved);

                // Chart initialization
                let lineCurrent = new Array(7).fill(0);
                let linePrev = new Array(7).fill(0);
                let lineLabels = Array.from({ length: 7 }).map((_, i) => format(subDays(new Date(), 6 - i), 'MMM dd'));

                let demandLabels = [];
                let demandDataArr = [];
                let stackedAcc = [];
                let stackedRej = [];
                let stackedPen = [];

                try {
                    const eventsRes = await getEvents(20);
                    const allEvents = eventsRes.documents || [];
                    const topEvents = [...allEvents].sort((a, b) => (b.participation_count || 0) - (a.participation_count || 0)).slice(0, 5);

                    demandLabels = topEvents.map(e => e.event_name?.length > 15 ? e.event_name.substring(0, 15) + '...' : e.event_name);
                    demandDataArr = topEvents.map(e => e.participation_count || 0);

                    const odsRes = await getAllODRequests(200);
                    const ods = odsRes?.documents || [];

                    const todayTime = startOfDay(new Date()).getTime();
                    ods.forEach(od => {
                        const odTime = startOfDay(parseISO(od.$createdAt)).getTime();
                        const diff = Math.floor((todayTime - odTime) / (1000 * 60 * 60 * 24));
                        if (diff >= 0 && diff < 7) {
                            lineCurrent[6 - diff]++;
                        } else if (diff >= 7 && diff < 14) {
                            linePrev[13 - diff]++;
                        }
                    });

                    const eventStatsMap = {};
                    topEvents.forEach(e => {
                        eventStatsMap[e.$id] = { accepted: 0, rejected: 0, pending: 0 };
                    });

                    ods.forEach(od => {
                        if (od.event_id && eventStatsMap[od.event_id]) {
                            if (od.current_status === 'granted' || od.current_status === 'approved') {
                                eventStatsMap[od.event_id].accepted++;
                            } else if (od.current_status === 'rejected') {
                                eventStatsMap[od.event_id].rejected++;
                            } else {
                                eventStatsMap[od.event_id].pending++;
                            }
                        }
                    });

                    stackedAcc = topEvents.map(e => eventStatsMap[e.$id].accepted);
                    stackedRej = topEvents.map(e => eventStatsMap[e.$id].rejected);
                    stackedPen = topEvents.map(e => eventStatsMap[e.$id].pending);
                } catch (err) {
                    console.error("Failed fetching chart data", err);
                }

                setStatsData({
                    totalEvents: eventStats.total || 0,
                    activeEvents: eventStats.total || 0,
                    totalSubmissions: totalSub,
                    pendingApprovals: pending,
                    approvedTotal: approved,
                    rejectedTotal: rejected,
                    totalStudents: studentStats.total || 0,
                    totalFaculty: facultiesRes.total || 0,
                    totalAdmins: adminsRes.total || 0,
                    totalSudo: sudosRes.total || 0
                });

                setChartData({
                    lineChart: { current: lineCurrent, previous: linePrev, labels: lineLabels },
                    demand: { labels: demandLabels, data: demandDataArr },
                    stacked: { labels: demandLabels, accepted: stackedAcc, rejected: stackedRej, pending: stackedPen }
                });

            } catch (error) {
                console.error("Error fetching sudo dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAllStats();
    }, []);

    const config = {
        bgGradient: "from-slate-800 via-slate-700 to-slate-900",
        greeting: "System Overview",
        emoji: "⚙️",
        primaryAction: "Manage Users",
        statsColors: [
            "text-slate-600", "text-gray-700", "text-zinc-600", "text-neutral-600", "text-stone-600", "text-slate-700"
        ]
    };

    const lineChartDataObj = {
        labels: chartData.lineChart.labels,
        datasets: [
            {
                label: 'Current Period',
                data: chartData.lineChart.current,
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderWidth: 2
            },
            {
                label: 'Previous Period',
                data: chartData.lineChart.previous,
                borderColor: '#CBD5E1',
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 0,
                borderWidth: 2
            }
        ]
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', size: 12 } } },
            tooltip: {
                mode: 'index', intersect: false, backgroundColor: '#ffffff', titleColor: '#1e293b', bodyColor: '#475569', borderColor: '#e2e8f0', borderWidth: 1, padding: 12, displayColors: true,
            }
        },
        scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: '#f8fafc', drawBorder: false }, border: { display: false }, beginAtZero: true }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
    };

    const horizontalBarData = {
        labels: chartData.demand.labels,
        datasets: [
            {
                label: 'Applications',
                data: chartData.demand.data,
                backgroundColor: [
                    '#4F46E5',
                    '#E2E8F0',
                    '#E2E8F0',
                    '#E2E8F0',
                    '#E2E8F0',
                ],
                borderRadius: 4,
            }
        ]
    };

    const horizontalBarOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#1E293B', padding: 10, cornerRadius: 8, }
        },
        scales: {
            x: { display: false, grid: { display: false } },
            y: { grid: { display: false }, border: { display: false } }
        }
    };

    const acceptedTotal = statsData.approvedTotal;
    const rejectedTotal = statsData.rejectedTotal;
    const pendingTotal = statsData.pendingApprovals;
    const totalDonut = acceptedTotal + rejectedTotal + pendingTotal;
    const acceptPercent = totalDonut > 0 ? Math.round((acceptedTotal / totalDonut) * 100) : 0;

    const donutData = {
        labels: ['Accepted', 'Rejected', 'Pending'],
        datasets: [{
            data: [acceptedTotal, rejectedTotal, pendingTotal],
            backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const donutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: { usePointStyle: true, padding: 20, font: { family: 'Inter', size: 12 } }
            },
            tooltip: { backgroundColor: '#1E293B', padding: 12, cornerRadius: 8 }
        }
    };

    const stackedBarDataObj = {
        labels: chartData.stacked.labels,
        datasets: [
            {
                label: 'Accepted',
                data: chartData.stacked.accepted,
                backgroundColor: '#10B981',
                borderRadius: 4,
            },
            {
                label: 'Rejected',
                data: chartData.stacked.rejected,
                backgroundColor: '#EF4444',
                borderRadius: 4,
            },
            {
                label: 'Pending',
                data: chartData.stacked.pending,
                backgroundColor: '#F59E0B',
                borderRadius: 4,
            }
        ]
    };

    const stackedBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', align: 'end', labels: { usePointStyle: true, font: { family: 'Inter', size: 12 } } },
            tooltip: { mode: 'index', intersect: false, backgroundColor: '#1E293B', padding: 10, cornerRadius: 8 }
        },
        scales: {
            x: { stacked: true, grid: { display: false }, border: { display: false } },
            y: { stacked: true, grid: { color: '#F1F5F9' }, border: { display: false }, beginAtZero: true }
        }
    };

    return (
        <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#F5F7FA] -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 pt-4 -mt-4">
            {/* Minimal Hero / Stats Header */}
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.bgGradient} p-6 sm:p-8 shadow-sm`}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
                            System Dashboard {config.emoji}
                        </h1>
                        <p className="text-white/80 font-medium">
                            {config.greeting}, {user?.name?.split(" ")[0]}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4 mt-4 sm:mt-0">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 text-white min-w-[90px] text-center sm:text-left">
                            <div className="text-[10px] sm:text-xs font-semibold uppercase opacity-70 mb-1">Students</div>
                            <div className="text-xl sm:text-2xl font-black">{statsData.totalStudents}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 text-white min-w-[90px] text-center sm:text-left">
                            <div className="text-[10px] sm:text-xs font-semibold uppercase opacity-70 mb-1">Faculty</div>
                            <div className="text-xl sm:text-2xl font-black">{statsData.totalFaculty}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 text-white min-w-[90px] text-center sm:text-left">
                            <div className="text-[10px] sm:text-xs font-semibold uppercase opacity-70 mb-1">Admins</div>
                            <div className="text-xl sm:text-2xl font-black">{statsData.totalAdmins}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 text-white min-w-[90px] text-center sm:text-left">
                            <div className="text-[10px] sm:text-xs font-semibold uppercase opacity-70 mb-1">Sudo</div>
                            <div className="text-xl sm:text-2xl font-black">{statsData.totalSudo}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 text-white min-w-[90px] text-center sm:text-left">
                            <div className="text-[10px] sm:text-xs font-semibold uppercase opacity-70 mb-1">Submissions</div>
                            <div className="text-xl sm:text-2xl font-black">{statsData.totalSubmissions}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard title="Events" value={loading ? "..." : statsData.totalEvents} icon={<Icons.Events />} colorClass="text-blue-600" delay="0" />
                <StatCard title="Active" value={loading ? "..." : statsData.activeEvents} icon={<Icons.Events />} colorClass="text-emerald-500" delay="50" />
                <StatCard title="Students" value={loading ? "..." : statsData.totalStudents} icon={<Icons.Students />} colorClass="text-purple-500" delay="100" />
                <StatCard title="Submissions" value={loading ? "..." : statsData.totalSubmissions} icon={<Icons.Submissions />} colorClass="text-indigo-500" delay="150" />
                <StatCard title="Pending" value={loading ? "..." : statsData.pendingApprovals} icon={<Icons.Approvals />} colorClass="text-amber-500" delay="200" alert={statsData.pendingApprovals > 0} />
                <StatCard title="Approved" value={loading ? "..." : statsData.approvedTotal} icon={<Icons.Certificate />} colorClass="text-emerald-500" delay="250" />
            </div>

            {/* 1. TOP ROW: Line Chart (Trend) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 relative">
                {loading && <LoaderOverlay />}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Applications Over Time</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">Application trend over the current month</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-100 shadow-sm">
                        <span>📈</span> Live Feed
                    </div>
                </div>
                <div className="h-[280px] w-full">
                    <Line data={lineChartDataObj} options={lineChartOptions} />
                </div>
            </div>

            {/* 2. MIDDLE ROW: Horizontal Bar + Donut Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Horizontal Bar: Demand */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 relative">
                    {loading && <LoaderOverlay />}
                    <div className="mb-6 flex justify-between items-start pr-2">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Applications Per Event</h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">Highest to lowest demand</p>
                        </div>
                        <div className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 border border-orange-100 shadow-sm">
                            🔥 Most Popular
                        </div>
                    </div>

                    <div className="h-[260px] w-full relative -ml-4">
                        <Bar data={horizontalBarData} options={horizontalBarOptions} />
                    </div>
                </div>

                {/* Donut Chart: Distribution */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 relative flex flex-col">
                    {loading && <LoaderOverlay />}
                    <div className="mb-4 text-center">
                        <h2 className="text-lg font-bold text-slate-800">Global Acceptance Rate</h2>
                    </div>

                    <div className="flex-1 relative min-h-[180px]">
                        <Doughnut data={donutData} options={donutOptions} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-28px]">
                            <span className="text-3xl font-black text-slate-800">
                                {acceptPercent}%
                            </span>
                        </div>
                    </div>

                    <div className="text-center mt-4 border-t border-slate-100 pt-4">
                        <p className="text-[13px] text-slate-500 font-medium tracking-wide">
                            <span className="text-emerald-500 font-bold">{acceptedTotal}</span> Accepted <span className="mx-2 opacity-30">|</span> <span className="text-red-500 font-bold">{rejectedTotal}</span> Rejected <span className="mx-2 opacity-30">|</span> <span className="text-amber-500 font-bold">{pendingTotal}</span> Pending
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. BOTTOM ROW: Stacked Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 relative">
                {loading && <LoaderOverlay />}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-800">Event Performance Comparison</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Comparing accepted vs rejected ratio per event</p>
                </div>
                <div className="h-[280px] w-full">
                    <Bar data={stackedBarDataObj} options={stackedBarOptions} />
                </div>
            </div>

        </div>
    );
}

function StatCard({ title, value, icon, colorClass, delay, alert }) {
    return (
        <div style={{ animationDelay: `${delay}ms` }} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-default">
            {alert && (
                <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            )}
            {alert && (
                <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full"></div>
            )}
            <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl bg-slate-50 transition-colors duration-300 group-hover:bg-slate-100 ${colorClass}`}>
                    {icon}
                </div>
            </div>
            <div>
                <div className="text-2xl font-black text-slate-800 tracking-tight">
                    {value}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">{title}</div>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity duration-300 group-hover:scale-110 ${colorClass}`}>
                {icon}
            </div>
        </div>
    );
}

function LoaderOverlay() {
    return (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );
}
