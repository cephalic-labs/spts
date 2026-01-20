"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] bg-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px]" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6">
        <div className="container mx-auto text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-primary uppercase bg-primary/5 rounded-full border border-primary/10">
            Welcome to the Future of Tracking
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-charcoal mb-6 leading-tight">
            Track Your <span className="text-primary">Academic</span> <br />
            Journey with <span className="text-accent underline decoration-4 underline-offset-8">Precision</span>
          </h1>
          <p className="text-xl text-charcoal/70 max-w-2xl mx-auto mb-10 leading-relaxed md:px-0 px-4">
            The SECE Student Participation Tracking System empowers students to monitor their growth, 
            earn achievements, and stay connected with college excellence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push("/signin")}
              className="btn-primary text-lg px-10 py-4 w-full sm:w-auto"
            >
              Get Started Now
            </button>
            <button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="btn-outline text-lg px-10 py-4 w-full sm:w-auto"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center p-6 glass-card rounded-2xl">
              <div className="text-3xl font-bold text-primary mb-1">2000+</div>
              <div className="text-sm text-charcoal/60 font-medium">Students Joined</div>
            </div>
            <div className="text-center p-6 glass-card rounded-2xl">
              <div className="text-3xl font-bold text-primary mb-1">500+</div>
              <div className="text-sm text-charcoal/60 font-medium">Events Hosted</div>
            </div>
            <div className="text-center p-6 glass-card rounded-2xl">
              <div className="text-3xl font-bold text-primary mb-1">10k+</div>
              <div className="text-sm text-charcoal/60 font-medium">Points Earned</div>
            </div>
            <div className="text-center p-6 glass-card rounded-2xl">
              <div className="text-3xl font-bold text-primary mb-1">50+</div>
              <div className="text-sm text-charcoal/60 font-medium">Achievement Awards</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-cool-gray/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-charcoal mb-4">Powerful Features for Your Success</h2>
            <p className="text-charcoal/60 max-w-xl mx-auto">Modern tools designed to help you excel in your academic and extracurricular journey.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-cool-gray/50 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <svg className="w-8 h-8 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Real-time Tracking</h3>
              <p className="text-charcoal/60 leading-relaxed">
                Monitor your participation across multiple events with instantaneous updates and performance analytics.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-cool-gray/50 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent transition-colors">
                <svg className="w-8 h-8 text-accent group-hover:text-charcoal transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Reward System</h3>
              <p className="text-charcoal/60 leading-relaxed">
                Earn points for every activity. Redemption and leaderboard features keep you motivated to achieve more.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-cool-gray/50 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-success transition-colors">
                <svg className="w-8 h-8 text-success group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Global Connectivity</h3>
              <p className="text-charcoal/60 leading-relaxed">
                Connect with peers and mentors. Share achievements and collaborate on campus-wide initiatives effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden bg-primary">
         {/* Background pattern */}
         <div className="absolute inset-0 opacity-10">
            <div className="absolute transform -rotate-12 -left-20 -bottom-20 w-96 h-96 border-[40px] border-white rounded-full"></div>
            <div className="absolute transform rotate-12 -right-20 -top-20 w-80 h-80 border-[40px] border-white rounded-full"></div>
         </div>
         
         <div className="container mx-auto text-center relative z-10">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to start your journey?</h2>
            <p className="text-white/80 text-xl mb-10 max-w-xl mx-auto">
              Join thousands of students who are already shaping their legacy through SPTS.
            </p>
            <Link href="/signin" className="bg-accent hover:bg-white text-charcoal font-bold py-4 px-12 rounded-xl transition-all duration-300 shadow-xl inline-block">
              Register via Google Account
            </Link>
         </div>
      </section>
    </div>
  );
}
