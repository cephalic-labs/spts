"use client";

import RoleProtected from "@/components/RoleProtected";
import LogoutButton from "@/components/LogoutButton";
import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";

// Icons as SVG components for simplicity and to avoid extra dependencies
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Events: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Submissions: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Approvals: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Reports: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Students: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  ),
  Faculty: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Departments: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Import: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Notifications: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

const StatCard = ({ icon, value, label, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-lg flex items-center justify-center ${color.bg} ${color.text} bg-opacity-10 text-white !opacity-100`}>
       <div className={`${color.bg} p-2.5 rounded-lg opacity-100 shadow-sm`}>
          {icon}
       </div>
    </div>
    <div>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500 font-medium">{label}</div>
    </div>
  </div>
);

export default function SudoDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Dashboard");

  const sidebarItems = [
    { name: "Dashboard", icon: <Icons.Dashboard /> },
    { name: "Events", icon: <Icons.Events /> },
    { name: "Submissions", icon: <Icons.Submissions /> },
    { name: "Approvals", icon: <Icons.Approvals /> },
    { name: "Reports", icon: <Icons.Reports /> },
    { name: "Students", icon: <Icons.Students /> },
    { name: "Faculty", icon: <Icons.Faculty /> },
    { name: "Departments", icon: <Icons.Departments /> },
    { name: "Excel Import", icon: <Icons.Import /> },
    { name: "Settings", icon: <Icons.Settings /> },
  ];

  const stats = [
    { value: 5, label: "Total Events", icon: <Icons.Events />, color: { bg: "bg-blue-600", text: "text-white" } },
    { value: 5, label: "Active Events", icon: <Icons.Events />, color: { bg: "bg-emerald-600", text: "text-white" } },
    { value: 0, label: "Total Submissions", icon: <Icons.Submissions />, color: { bg: "bg-emerald-700", text: "text-white" } },
    { value: 0, label: "Pending Approvals", icon: <Icons.Approvals />, color: { bg: "bg-orange-500", text: "text-white" } },
    { value: 0, label: "Approved", icon: <Icons.Approvals />, color: { bg: "bg-green-600", text: "text-white" } },
    { value: 260, label: "Total Students", icon: <Icons.Students />, color: { bg: "bg-purple-600", text: "text-white" } },
  ];

  return (
    <RoleProtected allowedRoles={["sudo"]}>
      <div className="min-h-screen bg-[#F8F9FA] flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1E2761] text-white flex flex-col fixed h-full z-20 shadow-xl">
          <div className="p-6 flex items-center gap-3 border-b border-white/5">
            <img src="/sece_emblem.webp" alt="Logo" className="w-12 h-12 object-contain" />
            <h2 className="text-sm font-bold leading-tight">Student Participation Tracker</h2>
          </div>

          <div className="px-6 py-8 flex flex-col items-center border-b border-white/5">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 border border-white/30 overflow-hidden">
              {user?.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]
              )}
            </div>
            <h3 className="font-bold text-base mb-0.5">{user?.name || "Super Admin"}</h3>
            <span className="px-2 py-0.5 bg-white/10 rounded-md text-[9px] font-black tracking-[0.1em] text-white/70 uppercase">{user?.labels[0]}</span>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-all group ${
                  activeTab === item.name
                    ? "bg-[#3D4CAB] text-white shadow-inner border-r-[4px] border-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className={`${activeTab === item.name ? "text-white" : "text-white/40 group-hover:text-white"}`}>
                  {item.icon}
                </span>
                {item.name}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
             <LogoutButton className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 text-xs font-bold transition-all border border-white/10" />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          {/* Header */}
          <header className="h-16 bg-[#252D63] text-white flex items-center justify-end px-8 sticky top-0 z-10 shadow-lg">
            <div className="flex items-center gap-4">
              <button className="hover:bg-white/10 p-2 rounded-lg transition-colors relative group">
                <Icons.Notifications />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#252D63]"></span>
              </button>
            </div>
          </header>

          <main className="p-10 max-w-7xl mx-auto w-full">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h1 className="text-4xl font-black text-[#1E2761] flex items-center gap-3 tracking-tight">
  System Dashboard, {user?.name?.split(" ")[0]} <span className="animate-bounce">🚀</span>
</h1>
                <div className="mt-3 flex items-center gap-3">
                   <div className="bg-[#1E2761] text-white text-[10px] font-black px-3 py-1 rounded shadow-sm tracking-wider uppercase">
                      Role: {user?.labels[0]}
                   </div>
                   <div className="text-gray-400 text-sm font-medium border-l border-gray-200 pl-3">
                      Full system overview and control
                   </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-[#3E7BCB] font-bold text-[11px] uppercase tracking-widest transition-all shadow-sm active:scale-95">
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

            {/* Participation Table Section */}
            <section className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden mb-10">
              <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#1E2761]">Participation & Prize by Class</h2>
                  <p className="text-gray-400 text-sm font-medium mt-1">Real-time participation metrics by academic year</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase pl-2">Event Type</span>
                    <select className="text-xs font-bold border-none bg-white rounded-lg px-4 py-2 focus:outline-none focus:ring-0 shadow-sm cursor-pointer min-w-[140px]">
                      <option>All Types</option>
                      <option>Hackathon</option>
                      <option>Symposium</option>
                      <option>Workshop</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto min-h-[340px]">
                <table className="w-full text-left">
                  <thead className="bg-[#F8F9FA]">
                    <tr>
                      <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Class (Year-Section)</th>
                      <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Students Participated</th>
                      <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Prize Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr className="group">
                      <td colSpan="3" className="px-8 py-28 text-center">
                        <div className="flex flex-col items-center gap-3">
                           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-2">
                              <Icons.Submissions />
                           </div>
                           <p className="text-gray-400 font-bold text-sm tracking-tight">No data available for the selected event type</p>
                           <p className="text-gray-300 text-xs">Try changing the filters or check back later</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
              <div className="bg-gradient-to-br from-[#00BCD4] to-[#0097A7] rounded-3xl p-10 text-white relative overflow-hidden shadow-xl shadow-cyan-200/50 group">
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                      <Icons.Dashboard />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">Real-Time Analytics</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div>
                      <div className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-3">Active Participants</div>
                      <div className="text-6xl font-black tracking-tighter">1</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-3">Registrations (Last 7d)</div>
                      <div className="text-6xl font-black tracking-tighter">11</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full p-20 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                   <Icons.Dashboard />
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#7986CB] to-[#5C6BC0] rounded-3xl p-10 text-white relative overflow-hidden shadow-xl shadow-indigo-200/50 group">
                <div className="relative z-10 text-center flex flex-col items-center justify-center h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                      <Icons.Reports />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">Star Performers</h3>
                  </div>
                  
                  <div className="mt-6">
                    <div className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-4">Outperforming Department (Prize Total)</div>
                    <div className="text-4xl font-black tracking-tighter mb-2">N/A — ₹0K</div>
                    <div className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-bold backdrop-blur-sm border border-white/10">Data pending validation</div>
                  </div>
                </div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700">
                   <Icons.Reports />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleProtected>
  );
}