"use client";

import { useAuth } from "@/lib/AuthContext";
import { useSignInModal } from "@/lib/SignInModalContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const { openSignIn } = useSignInModal();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!loading && user) {
    // Prevent rendering the landing page for authenticated users while redirecting
    return null;
  }

  const stats = [
    { value: "2000+", label: "Students Joined" },
    { value: "500+", label: "Events Hosted" },
    { value: "10k+", label: "Points Earned" },
    { value: "50+", label: "Achievement Awards" },
  ];

  const features = [
    { title: "Real-time Tracking", desc: "Monitor your participation across multiple events with instantaneous updates and performance analytics.", color: "primary", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { title: "Reward System", desc: "Earn points for every activity. Redemption and leaderboard features keep you motivated to achieve more.", color: "accent", icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" },
    { title: "Global Connectivity", desc: "Connect with peers and mentors. Share achievements and collaborate on campus-wide initiatives effortlessly.", color: "success", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[var(--bg-color)] text-[var(--text-color)] relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <section className="relative pt-24 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="inline-block px-4 py-1.5 mb-8 text-sm font-semibold tracking-wide text-primary uppercase bg-primary/5 rounded-full border border-primary/10 animate-bounce shadow-sm">
            Welcome to the Future of Tracking
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tight">
            Track Your <span className="text-primary text-glow">Academic</span> <br />
            Journey with <span className="text-accent underline decoration-8 underline-offset-12 decoration-accent/30 italic">Precision</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-70 max-w-3xl mx-auto mb-12 leading-relaxed md:px-0 px-4">
            The SECE Student Participation Tracking System empowers students to monitor their growth, earn achievements, and stay connected with college excellence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button onClick={openSignIn} className="btn-primary text-xl px-12 py-5 w-full sm:w-auto hover:-translate-y-1 transition-transform">
              Get Started Now
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>
            <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="btn-outline text-xl px-12 py-5 w-full sm:w-auto dark:border-white/80 dark:text-white dark:hover:bg-white dark:hover:text-charcoal group">
              Learn More
              <svg className="w-6 h-6 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 relative z-10">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-8 glass-card rounded-[2rem] animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
                <div className="text-4xl font-black text-primary mb-2">{stat.value}</div>
                <div className="text-sm opacity-60 font-bold uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-32 px-6 bg-cool-gray/30 dark:bg-charcoal/30 relative">
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Powerful Features for Your Success</h2>
            <p className="opacity-60 max-w-2xl mx-auto text-lg">Modern tools designed to help you excel in your academic and extracurricular journey.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {features.map((f, i) => (
              <div key={i} className={`p-10 bg-[var(--card-bg)] rounded-[2.5rem] shadow-sm border border-[var(--card-border)] dark:border-white/5 hover:shadow-2xl dark:hover:shadow-${f.color}/5 hover:-translate-y-4 transition-all duration-500 group relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${f.color}/5 rounded-bl-[5rem] transition-all group-hover:bg-${f.color}/10`} />
                <div className={`w-20 h-20 bg-${f.color}/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-${f.color} transition-colors duration-500 group-hover:rotate-6`}>
                  <svg className={`w-10 h-10 text-${f.color} group-hover:text-white transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                  </svg>
                </div>
                <h3 className={`text-2xl font-black mb-4 group-hover:text-${f.color} transition-colors`}>{f.title}</h3>
                <p className="opacity-60 leading-relaxed text-lg">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 relative overflow-hidden bg-primary group">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute transform -rotate-12 -left-20 -bottom-20 w-[40rem] h-[40rem] border-[60px] border-white rounded-full group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute transform rotate-12 -right-20 -top-20 w-[30rem] h-[30rem] border-[60px] border-white rounded-full group-hover:scale-110 transition-transform duration-1000" />
        </div>
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight">Ready to start your journey?</h2>
          <p className="text-white/90 text-2xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students who are already shaping their legacy through SPTS.
          </p>
          <button onClick={openSignIn} className="bg-accent hover:bg-white text-charcoal font-black text-2xl py-6 px-16 rounded-2xl transition-all duration-500 shadow-2xl inline-block hover:scale-105 active:scale-95">
            Register via Google Account
          </button>
        </div>
      </section>
    </div>
  );
}
