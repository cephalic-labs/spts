"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Icons } from "@/components/layout";
import { getRoleDisplayName } from "@/lib/sidebarConfig";
import {
  getODStats,
  getAllODRequests,
  getStudentODRequests,
} from "@/lib/services/odRequestService";
import {
  getEventStats,
  getEvents,
  incrementViewCount,
} from "@/lib/services/eventService";
import {
  getStudentEventParticipations,
  PARTICIPATION_STATUS,
  setStudentParticipationStatus,
} from "@/lib/services/eventParticipationService";
import {
  getStudentByAppwriteUserId,
  getStudentByEmail,
} from "@/lib/services/studentService";
import { OD_CATEGORY_FIELDS } from "@/lib/dbConfig";
import { format, subDays, parseISO, startOfDay } from "date-fns";
import EventDetailsModal from "@/components/pages/EventDetailsModal";
import StudentDeadlineLists from "@/components/dashboards/StudentDeadlineLists";

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
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

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
  Filler,
);

function getODValue(student, field) {
  const value = student?.[field];
  if (value === undefined || value === null || value === "") return 0;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getStudentTotalOD(student) {
  if (student?.od_count !== undefined && student?.od_count !== null) {
    const count = parseInt(student.od_count, 10);
    return Number.isNaN(count) ? 7 : count;
  }
  return 7;
}

export default function DefaultDashboardContent({ role }) {
  const { user } = useAuth();
  const displayName = getRoleDisplayName(role);
  const [stats, setStats] = useState({
    events: 0,
    submissions: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    lineChart: { current: [], previous: [], labels: [] },
    demand: { labels: [], data: [] },
    stacked: { labels: [], accepted: [], rejected: [], pending: [] },
  });
  const [odCount, setOdCount] = useState(role === "student" ? 7 : null);
  const [odBreakdown, setOdBreakdown] = useState({});
  const [studentEvents, setStudentEvents] = useState([]);
  const [participationByEvent, setParticipationByEvent] = useState({});
  const [savingParticipationFor, setSavingParticipationFor] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewEventModalOpen, setViewEventModalOpen] = useState(false);
  const [pendingEventsRequest, setPendingEventsRequest] = useState(new Set());

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const eventData = await getEventStats();
        const student =
          role === "student"
            ? await getStudentByAppwriteUserId(user?.$id)
            : null;
        const odFilter =
          role === "student"
            ? { student_id: user?.$id || user?.dbId, rollNo: student?.roll_no }
            : {};
        const odData = await getODStats(odFilter);

        // Fetch student OD count for student role
        if (role === "student" && user) {
          try {
            let student = null;
            if (user.email) {
              student = await getStudentByEmail(user.email);
            }
            if (!student && user.$id) {
              student = await getStudentByAppwriteUserId(user.$id);
            }
            if (student) {
              const count = getStudentTotalOD(student);
              setOdCount(count);
              const breakdown = OD_CATEGORY_FIELDS.reduce(
                (accumulator, field) => {
                  accumulator[field] = getODValue(student, field);
                  return accumulator;
                },
                {},
              );
              setOdBreakdown(breakdown);

              const studentEventsResponse = await getEvents(50);
              setStudentEvents(studentEventsResponse.documents || []);

              const participationResponse = await getStudentEventParticipations(
                [user.$id, student.$id].filter(Boolean)
              );
              const nextParticipationMap = {};
              for (const participation of participationResponse.documents ||
                []) {
                nextParticipationMap[participation.event_id] = participation;
              }
              setParticipationByEvent(nextParticipationMap);

              if (student.roll_no) {
                const response = await getStudentODRequests(
                  student.$id || user.$id,
                  100,
                  student.roll_no,
                );
                const pendingIds = new Set(
                  (response.documents || [])
                    .filter((od) => {
                      const status = od.current_status;
                      return (
                        status &&
                        (status.startsWith("pending_") ||
                          status === "granted" ||
                          status === "approved")
                      );
                    })
                    .map((od) => od.event_id),
                );
                setPendingEventsRequest(pendingIds);
              }
            }
          } catch (err) {
            console.warn("Failed to fetch student dashboard data:", err);
            // Fallback: keep default values
          }
        }

        let totalSub = odData.total || 0;
        let pending = odData.pending || 0;
        let approved = odData.approved || 0;
        let rejected = Math.max(0, totalSub - pending - approved);

        setStats({
          events: eventData.total || 0,
          submissions: totalSub,
          pending: pending,
          approved: approved,
          rejected: rejected,
        });

        if (role !== "student") {
          // Initialize empty chart arrays
          let lineCurrent = new Array(7).fill(0);
          let linePrev = new Array(7).fill(0);
          let lineLabels = Array.from({ length: 7 }).map((_, i) =>
            format(subDays(new Date(), 6 - i), "MMM dd"),
          );

          let demandLabels = [];
          let demandDataArr = [];
          let stackedAcc = [];
          let stackedRej = [];
          let stackedPen = [];

          try {
            // Fetch real events
            const eventsRes = await getEvents(20);
            const allEvents = eventsRes.documents || [];
            const topEvents = [...allEvents]
              .sort(
                (a, b) =>
                  (b.participation_count || 0) - (a.participation_count || 0),
              )
              .slice(0, 5);

            demandLabels = topEvents.map((e) =>
              e.event_name?.length > 15
                ? e.event_name.substring(0, 15) + "..."
                : e.event_name,
            );
            demandDataArr = topEvents.map((e) => e.participation_count || 0);

            // Fetch real ODs for line & stacked chart
            const odsRes = await getAllODRequests(200);
            const ods = odsRes?.documents || [];

            // Calculate Time Series
            const todayTime = startOfDay(new Date()).getTime();
            ods.forEach((od) => {
              const odTime = startOfDay(parseISO(od.$createdAt)).getTime();
              const diff = Math.floor(
                (todayTime - odTime) / (1000 * 60 * 60 * 24),
              );
              if (diff >= 0 && diff < 7) {
                lineCurrent[6 - diff]++;
              } else if (diff >= 7 && diff < 14) {
                linePrev[13 - diff]++;
              }
            });

            // Calculate Event Performance
            const eventStatsMap = {};
            topEvents.forEach((e) => {
              eventStatsMap[e.$id] = { accepted: 0, rejected: 0, pending: 0 };
            });

            ods.forEach((od) => {
              if (od.event_id && eventStatsMap[od.event_id]) {
                if (
                  od.current_status === "granted" ||
                  od.current_status === "approved"
                ) {
                  eventStatsMap[od.event_id].accepted++;
                } else if (od.current_status === "rejected") {
                  eventStatsMap[od.event_id].rejected++;
                } else {
                  eventStatsMap[od.event_id].pending++;
                }
              }
            });

            stackedAcc = topEvents.map((e) => eventStatsMap[e.$id].accepted);
            stackedRej = topEvents.map((e) => eventStatsMap[e.$id].rejected);
            stackedPen = topEvents.map((e) => eventStatsMap[e.$id].pending);
          } catch (err) {
            console.error("Failed fetching chart data", err);
          }

          setChartData({
            lineChart: {
              current: lineCurrent,
              previous: linePrev,
              labels: lineLabels,
            },
            demand: { labels: demandLabels, data: demandDataArr },
            stacked: {
              labels: demandLabels,
              accepted: stackedAcc,
              rejected: stackedRej,
              pending: stackedPen,
            },
          });
        }
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
      case "student":
        return {
          bgGradient: "from-indigo-600 via-purple-600 to-fuchsia-600",
          greeting: "Ready to win?",
          icon: <Icons.GraduationCap className="w-8 h-8" />,

          primaryAction: "Browse Events",
          statsColors: [
            "text-indigo-600",
            "text-purple-600",
            "text-fuchsia-600",
            "text-pink-600",
          ],
        };
      case "admin":
        return {
          bgGradient: "from-slate-800 via-slate-700 to-slate-900",
          greeting: "System Overview",
          icon: <Icons.Settings className="w-8 h-8" />,

          primaryAction: "Manage Users",
          statsColors: [
            "text-slate-600",
            "text-gray-700",
            "text-zinc-600",
            "text-neutral-600",
          ],
        };
      default:
        return {
          bgGradient: "from-blue-600 via-cyan-600 to-teal-500",
          greeting: "Empowering Students",
          icon: <Icons.Star className="w-8 h-8" />,

          primaryAction: "Review Pending",
          statsColors: [
            "text-blue-600",
            "text-cyan-600",
            "text-teal-600",
            "text-sky-600",
          ],
        };
    }
  };

  const config = getRoleConfig();

  const handleOpenEvent = async (event) => {
    setSelectedEvent(event);
    setViewEventModalOpen(true);

    if (event?.event_url) {
      try {
        await incrementViewCount(event.$id);
        setStudentEvents((prev) =>
          prev.map((currentEvent) =>
            currentEvent.$id === event.$id
              ? {
                  ...currentEvent,
                  view_count: (currentEvent.view_count || 0) + 1,
                }
              : currentEvent,
          ),
        );
      } catch (error) {
        console.error("Failed to increment view count:", error);
      }
    }
  };

  const handleParticipationChange = async (eventId, status) => {
    const studentId = student?.$id || user?.$id;
    if (!studentId) return;

    setSavingParticipationFor(eventId);

    try {
      const result = await setStudentParticipationStatus(
        eventId,
        studentId,
        status,
      );

      setParticipationByEvent((prev) => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          ...result.document,
          event_id: eventId,
          student_id: studentId,
          status,
        },
      }));

      if (result.countDelta !== 0) {
        setStudentEvents((prev) =>
          prev.map((event) => {
            if (event.$id !== eventId) return event;
            return {
              ...event,
              participation_count: Math.max(
                (event.participation_count || 0) + result.countDelta,
                0,
              ),
            };
          }),
        );
      }
    } catch (error) {
      alert("Failed to update your participation status.");
      console.error(error);
    } finally {
      setSavingParticipationFor(null);
    }
  };

  const visibleStudentEvents = studentEvents.filter(
    (event) => !pendingEventsRequest.has(event.$id),
  );

  if (role === "student") {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 -mx-4 -mt-4 space-y-6 bg-[#F5F7FA] px-4 pt-4 pb-8 duration-700 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.bgGradient} p-6 shadow-sm sm:p-8`}
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl"></div>
          <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h1 className="mb-1 flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {displayName} Portal {config.icon}
              </h1>

              <p className="font-medium text-white/80">{config.greeting}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div
                className={`rounded-xl border p-4 text-white backdrop-blur-md ${
                  odCount > 3
                    ? "border-white/20 bg-white/10"
                    : odCount > 0
                      ? "border-amber-300/30 bg-amber-500/20"
                      : "border-red-300/30 bg-red-500/20"
                }`}
              >
                <div className="mb-1 text-xs font-semibold uppercase opacity-70">
                  OD Remaining
                </div>
                <div className="text-2xl font-black">
                  {odCount !== null ? odCount : "—"}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1 text-[10px] text-white/80 sm:grid-cols-5">
                  {OD_CATEGORY_FIELDS.map((field) => (
                    <div
                      key={field}
                      className="rounded-lg bg-white/10 px-2 py-1 text-center"
                    >
                      <div className="font-semibold tracking-widest uppercase">
                        {field.replace("_", " ")}
                      </div>
                      <div className="text-sm font-black">
                        {odBreakdown[field] ?? 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-md">
                <div className="mb-1 text-xs font-semibold uppercase opacity-70">
                  Total Submissions
                </div>
                <div className="text-2xl font-black">{stats.submissions}</div>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-md">
                <div className="mb-1 text-xs font-semibold uppercase opacity-70">
                  Pending Action
                </div>
                <div className="text-2xl font-black">{stats.pending}</div>
              </div>
            </div>
          </div>
        </div>

        <StudentDeadlineLists
          events={visibleStudentEvents}
          onViewEvent={handleOpenEvent}
        />
        <EventDetailsModal
          isOpen={viewEventModalOpen}
          onClose={() => setViewEventModalOpen(false)}
          event={selectedEvent}
          canSelfReportParticipation={Boolean(user?.$id)}
          currentParticipationStatus={
            selectedEvent
              ? participationByEvent[selectedEvent.$id]?.status
              : null
          }
          isSavingParticipation={savingParticipationFor === selectedEvent?.$id}
          onParticipationChange={handleParticipationChange}
        />
      </div>
    );
  }

  // 1. Line Chart: Applications Over Time (Trend)
  const lineChartData = {
    labels: chartData.lineChart.labels,
    datasets: [
      {
        label: "Current Period",
        data: chartData.lineChart.current,
        borderColor: "#4F46E5", // Indigo-600
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        fill: true,
        tension: 0.4, // smooth curve
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: "Previous Period",
        data: chartData.lineChart.previous,
        borderColor: "#CBD5E1", // Slate-300
        borderDash: [5, 5],
        fill: false,
        tension: 0.4, // smooth curve
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { family: "Inter", size: 12 },
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#ffffff",
        titleColor: "#1e293b",
        bodyColor: "#475569",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: {
        grid: { color: "#f8fafc", drawBorder: false },
        border: { display: false },
        beginAtZero: true,
      },
    },
    interaction: { mode: "nearest", axis: "x", intersect: false },
  };

  // 2. Horizontal Bar: Applications Per Event (Demand)
  const horizontalBarData = {
    labels: chartData.demand.labels,
    datasets: [
      {
        label: "Applications",
        data: chartData.demand.data,
        backgroundColor: [
          "#4F46E5", // dark for top bar
          "#E2E8F0", // light for others
          "#E2E8F0",
          "#E2E8F0",
          "#E2E8F0",
        ],
        borderRadius: 4,
      },
    ],
  };

  const horizontalBarOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#1E293B", padding: 10, cornerRadius: 8 },
    },
    scales: {
      x: { display: false, grid: { display: false } },
      y: { grid: { display: false }, border: { display: false } },
    },
  };

  // 3. Donut Chart: Accepted vs Rejected vs Pending
  const acceptedTotal = stats.approved;
  const rejectedTotal = stats.rejected;
  const pendingTotal = stats.pending;
  const totalDonut = acceptedTotal + rejectedTotal + pendingTotal;
  const acceptPercent =
    totalDonut > 0 ? Math.round((acceptedTotal / totalDonut) * 100) : 0;

  const donutData = {
    labels: ["Accepted", "Rejected", "Pending"],
    datasets: [
      {
        data: [acceptedTotal, rejectedTotal, pendingTotal],
        backgroundColor: ["#10B981", "#EF4444", "#F59E0B"], // Green, Red, Amber
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: "Inter", size: 12 },
        },
      },
      tooltip: { backgroundColor: "#1E293B", padding: 12, cornerRadius: 8 },
    },
  };

  // 4. Stacked Bar Chart: Event Performance Comparison
  const stackedBarData = {
    labels: chartData.stacked.labels,
    datasets: [
      {
        label: "Accepted",
        data: chartData.stacked.accepted,
        backgroundColor: "#10B981", // Green
        borderRadius: 4,
      },
      {
        label: "Rejected",
        data: chartData.stacked.rejected,
        backgroundColor: "#EF4444", // Red
        borderRadius: 4,
      },
      {
        label: "Pending",
        data: chartData.stacked.pending,
        backgroundColor: "#F59E0B", // Amber
        borderRadius: 4,
      },
    ],
  };

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { usePointStyle: true, font: { family: "Inter", size: 12 } },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#1E293B",
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        border: { display: false },
      },
      y: {
        stacked: true,
        grid: { color: "#F1F5F9" },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 -mx-4 -mt-4 space-y-6 bg-[#F5F7FA] px-4 pt-4 pb-8 duration-700 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
      {/* Minimal Hero / Stats Header */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.bgGradient} p-6 shadow-sm sm:p-8`}
      >
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="mb-1 flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {displayName} Portal {config.icon}
            </h1>

            <p className="font-medium text-white/80">{config.greeting}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {role === "student" && (
              <div
                className={`rounded-xl border p-4 text-white backdrop-blur-md ${
                  odCount > 3
                    ? "border-white/20 bg-white/10"
                    : odCount > 0
                      ? "border-amber-300/30 bg-amber-500/20"
                      : "border-red-300/30 bg-red-500/20"
                }`}
              >
                <div className="mb-1 text-xs font-semibold uppercase opacity-70">
                  OD Remaining
                </div>
                <div className="text-2xl font-black">
                  {odCount !== null ? odCount : "—"}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1 text-[10px] text-white/80 sm:grid-cols-5">
                  {OD_CATEGORY_FIELDS.map((field) => (
                    <div
                      key={field}
                      className="rounded-lg bg-white/10 px-2 py-1 text-center"
                    >
                      <div className="font-semibold tracking-widest uppercase">
                        {field.replace("_", " ")}
                      </div>
                      <div className="text-sm font-black">
                        {odBreakdown[field] ?? 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-md">
              <div className="mb-1 text-xs font-semibold uppercase opacity-70">
                Total Submissions
              </div>
              <div className="text-2xl font-black">{stats.submissions}</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-md">
              <div className="mb-1 text-xs font-semibold uppercase opacity-70">
                Pending Action
              </div>
              <div className="text-2xl font-black">{stats.pending}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. TOP ROW: Line Chart (Trend) */}
      <div className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        {loading && <LoaderOverlay />}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Applications Over Time
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Application trend over the current month
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 shadow-sm">
            <Icons.TrendingUp className="w-3.5 h-3.5" /> Live Feed
          </div>

        </div>
        <div className="h-[280px] w-full">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* 2. MIDDLE ROW: Horizontal Bar + Donut Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Horizontal Bar: Demand */}
        <div className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2">
          {loading && <LoaderOverlay />}
          <div className="mb-6 flex items-start justify-between pr-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Applications Per Event
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Highest to lowest demand
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-600 shadow-sm">
              <Icons.Fire className="w-3.5 h-3.5" /> Most Popular
            </div>

          </div>

          <div className="relative -ml-4 h-[260px] w-full">
            <Bar data={horizontalBarData} options={horizontalBarOptions} />
          </div>
        </div>

        {/* Donut Chart: Distribution */}
        <div className="relative flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          {loading && <LoaderOverlay />}
          <div className="mb-4 text-center">
            <h2 className="text-lg font-bold text-slate-800">
              Acceptance Rate
            </h2>
          </div>

          <div className="relative min-h-[180px] flex-1">
            <Doughnut data={donutData} options={donutOptions} />
            <div className="pointer-events-none absolute inset-0 mt-[-28px] flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800">
                {acceptPercent}%
              </span>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 text-center">
            <p className="text-[13px] font-medium tracking-wide text-slate-500">
              <span className="font-bold text-emerald-500">
                {acceptedTotal}
              </span>{" "}
              Accepted <span className="mx-2 opacity-30">|</span>{" "}
              <span className="font-bold text-red-500">{rejectedTotal}</span>{" "}
              Rejected <span className="mx-2 opacity-30">|</span>{" "}
              <span className="font-bold text-amber-500">{pendingTotal}</span>{" "}
              Pending
            </p>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: Stacked Bar */}
      <div className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        {loading && <LoaderOverlay />}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800">
            Event Performance Comparison
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Comparing accepted vs rejected ratio per event
          </p>
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
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
    </div>
  );
}
