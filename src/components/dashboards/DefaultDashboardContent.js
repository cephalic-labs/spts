"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Icons } from "@/components/layout";
import { getRoleDisplayName } from "@/lib/sidebarConfig";
import { getODStats, getAllODRequests, getStudentODRequests } from "@/lib/services/odRequestService";
import { getEventStats, getEvents } from "@/lib/services/eventService";
import { format, subDays, parseISO, startOfDay } from "date-fns";

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
        rejected: 0
    });
    const [chartData, setChartData] = useState({
        lineChart: { current: [], previous: [], labels: [] },
        demand: { labels: [], data: [] },
        stacked: { labels: [], accepted: [], rejected: [] }
    });

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true);
                const eventData = await getEventStats();
                const odFilter = role === 'student' ? { student_id: user?.$id || user?.dbId } : {};
                const odData = await getODStats(odFilter);

                let totalSub = odData.total || 0;
                let pending = odData.pending || 0;
                let approved = odData.approved || 0;
                let rejected = Math.max(0, totalSub - pending - approved);

                // Initialize empty chart arrays
                let lineCurrent = new Array(7).fill(0);
                let linePrev = new Array(7).fill(0);
                let lineLabels = Array.from({ length: 7 }).map((_, i) => format(subDays(new Date(), 6 - i), 'MMM dd'));

                let demandLabels = [];
                let demandDataArr = [];
                let stackedAcc = [];
                let stackedRej = [];

                try {
                    // Fetch real events
                    const eventsRes = await getEvents(20);
                    const allEvents = eventsRes.documents || [];
                    const topEvents = [...allEvents].sort((a, b) => (b.participation_count || 0) - (a.participation_count || 0)).slice(0, 5);

                    demandLabels = topEvents.map(e => e.event_name?.length > 15 ? e.event_name.substring(0, 15) + '...' : e.event_name);
                    demandDataArr = topEvents.map(e => e.participation_count || 0);

                    // Fetch real ODs for line & stacked chart
                    let odsRes;
                    if (role === 'student') {
                        odsRes = await getStudentODRequests(user?.$id || user?.dbId, 200);
                    } else {
                        odsRes = await getAllODRequests(200);
                    }
                    const ods = odsRes?.documents || [];

                    // Calculate Time Series
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

                    // Calculate Event Performance
                    const eventStatsMap = {};
                    topEvents.forEach(e => {
                        eventStatsMap[e.$id] = { accepted: 0, rejected: 0 };
                    });

                    ods.forEach(od => {
                        if (od.event_id && eventStatsMap[od.event_id]) {
                            if (od.current_status === 'granted' || od.current_status === 'approved') {
                                eventStatsMap[od.event_id].accepted++;
                            } else if (od.current_status === 'rejected') {
                                eventStatsMap[od.event_id].rejected++;
                            }
                        }
                    });

                    stackedAcc = topEvents.map(e => eventStatsMap[e.$id].accepted);
                    stackedRej = topEvents.map(e => eventStatsMap[e.$id].rejected);
                } catch (err) {
                    console.error("Failed fetching chart data", err);
                }

                setStats({
                    events: eventData.total || 0,
                    submissions: totalSub,
                    pending: pending,
                    approved: approved,
                    rejected: rejected
                });

                setChartData({
                    lineChart: { current: lineCurrent, previous: linePrev, labels: lineLabels },
                    demand: { labels: demandLabels, data: demandDataArr },
                    stacked: { labels: demandLabels, accepted: stackedAcc, rejected: stackedRej }
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
            default:
                return {
                    bgGradient: "from-blue-600 via-cyan-600 to-teal-500",
                    greeting: "Empowering Students",
                    emoji: "🌟",
                    primaryAction: "Review Pending",
                    statsColors: ["text-blue-600", "text-cyan-600", "text-teal-600", "text-sky-600"]
                };
        }
    };

    const config = getRoleConfig();

    // 1. Line Chart: Applications Over Time (Trend)
    const lineChartData = {
        labels: chartData.lineChart.labels,
        datasets: [
            {
                label: 'Current Period',
                data: chartData.lineChart.current,
                borderColor: '#4F46E5', // Indigo-600
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4, // smooth curve
                pointRadius: 0,
                pointHoverRadius: 6,
                borderWidth: 2
            },
            {
                label: 'Previous Period',
                data: chartData.lineChart.previous,
                borderColor: '#CBD5E1', // Slate-300
                borderDash: [5, 5],
                fill: false,
                tension: 0.4, // smooth curve
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

    // 2. Horizontal Bar: Applications Per Event (Demand)
    const horizontalBarData = {
        labels: chartData.demand.labels,
        datasets: [
            {
                label: 'Applications',
                data: chartData.demand.data,
                backgroundColor: [
                    '#4F46E5', // dark for top bar
                    '#E2E8F0', // light for others
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

    // 3. Donut Chart: Accepted vs Rejected
    const acceptedTotal = stats.approved;
    const rejectedTotal = stats.rejected;
    const totalDonut = acceptedTotal + rejectedTotal;
    const acceptPercent = totalDonut > 0 ? Math.round((acceptedTotal / totalDonut) * 100) : 0;

    const donutData = {
        labels: ['Accepted', 'Rejected'],
        datasets: [{
            data: [acceptedTotal, rejectedTotal],
            backgroundColor: ['#10B981', '#EF4444'], // Green for accepted, Red for rejected
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

    // 4. Stacked Bar Chart: Event Performance Comparison
    const stackedBarData = {
        labels: chartData.stacked.labels,
        datasets: [
            {
                label: 'Accepted',
                data: chartData.stacked.accepted,
                backgroundColor: '#10B981', // Green
                borderRadius: 4,
            },
            {
                label: 'Rejected',
                data: chartData.stacked.rejected,
                backgroundColor: '#EF4444', // Red
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
                            {displayName} Portal {config.emoji}
                        </h1>
                        <p className="text-white/80 font-medium">
                            {config.greeting}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-white">
                            <div className="text-xs font-semibold uppercase opacity-70 mb-1">Total Submissions</div>
                            <div className="text-2xl font-black">{stats.submissions}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-white">
                            <div className="text-xs font-semibold uppercase opacity-70 mb-1">Pending Action</div>
                            <div className="text-2xl font-black">{stats.pending}</div>
                        </div>
                    </div>
                </div>
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
                        <span>📈</span> +18% vs last month
                    </div>
                </div>
                <div className="h-[280px] w-full">
                    <Line data={lineChartData} options={lineChartOptions} />
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
                        <h2 className="text-lg font-bold text-slate-800">Acceptance Rate</h2>
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
                            <span className="text-emerald-500 font-bold">{acceptedTotal}</span> Accepted <span className="mx-2 opacity-30">|</span> <span className="text-red-500 font-bold">{rejectedTotal}</span> Rejected
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
                    <Bar data={stackedBarData} options={stackedBarOptions} />
                </div>
            </div>

        </div>
    );
}

// Reusable loader
function LoaderOverlay() {
    return (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );
}
