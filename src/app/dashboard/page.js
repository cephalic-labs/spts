"use client";

import ProtectedRoute from "@/lib/ProtectedRoute";
import { useAuth } from "@/lib/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { value: "0", label: "Events Attended", sub: "Start participating", color: "primary", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { value: "0", label: "Participation Points", sub: "Attend events to earn", color: "accent", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
    { value: "0", label: "Achievements", sub: "Unlock your first badge!", color: "success", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" },
  ];

  const activities = [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-color)] px-6 py-12 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -ml-32 -mt-32 animate-float" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-[100px] -mr-32 -mb-32 animate-float" style={{ animationDelay: '2s' }} />

        <main className="container mx-auto relative z-10">
          <div className="glass-card rounded-[2.5rem] p-12 mb-12 group transition-all duration-500 hover:shadow-primary/10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div>
                <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                  Welcome back, <span className="text-primary text-glow">{user?.name || user?.email || "Student"}!</span>
                </h2>
                <p className="text-xl opacity-70 max-w-2xl leading-relaxed">You're making great progress in your academic journey. Here's a quick overview of your participation.</p>
              </div>
              <div className="bg-success/10 text-success font-bold py-3 px-6 rounded-2xl flex items-center gap-2 border border-success/20 animate-pulse">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Active Session
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {stats.map((s, i) => (
              <div key={i} className={`p-10 bg-[var(--card-bg)] rounded-[2.5rem] shadow-sm border border-[var(--card-border)] dark:border-white/5 hover:shadow-2xl dark:hover:shadow-${s.color}/5 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${s.color}/5 rounded-bl-[5rem]`} />
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-16 h-16 bg-${s.color}/10 rounded-2xl flex items-center justify-center group-hover:bg-${s.color} transition-colors duration-500 group-hover:scale-110`}>
                    <svg className={`w-8 h-8 text-${s.color} group-hover:text-white transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
                  </div>
                </div>
                <div className={`text-5xl font-black text-${s.color} mb-2`}>{s.value}</div>
                <p className="text-lg font-bold opacity-60 uppercase tracking-widest">{s.label}</p>
                <p className="text-sm opacity-40 mt-2 font-medium">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-[2.5rem] p-12 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <h3 className="text-3xl font-black mb-10 tracking-tight flex items-center gap-4">
              Recent Activity
              <span className="w-3 h-3 bg-primary rounded-full animate-ping" />
            </h3>
            {activities.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-cool-gray/20 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xl font-bold opacity-60 mb-3">No activity yet</p>
                <p className="opacity-40 font-medium">Start participating in events to see your activity here.</p>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {activities.map((a, i) => (
                    <div key={i} className={`p-6 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] dark:border-white/5 hover:border-${a.color}/50 dark:hover:border-${a.color}/30 transition-colors flex items-center gap-6 group/item`}>
                      <div className={`w-12 h-12 bg-${a.color}/10 rounded-xl flex items-center justify-center text-${a.color} group-hover/item:bg-${a.color} group-hover/item:text-white transition-all`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} /></svg>
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-black text-lg">{a.title}</h4>
                        <p className="opacity-60 font-medium">{a.sub}</p>
                      </div>
                      <div className={`text-${a.color} font-bold`}>{a.badge}</div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-12 py-4 px-8 border-2 border-primary/20 hover:border-primary/50 text-primary font-black rounded-2xl transition-all hover:bg-primary/5">
                  View All Activity
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}