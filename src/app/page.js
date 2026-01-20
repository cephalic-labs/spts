"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F5AA6]"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#E6E9EE] to-[#3E7BCB] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#1F5AA6] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#F4C430] rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Title Section */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-[#1F5AA6] mb-4">
              SECE SPTS
            </h1>
            <p className="text-2xl md:text-3xl text-[#2B2B2B] font-semibold">
              Student Participation Tracking System
            </p>
          </div>

          {/* Features Section */}
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E6E9EE] p-8 md:p-12 mb-8">
            <h2 className="text-3xl font-bold text-[#1F5AA6] mb-8">
              Track Your Academic Journey
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1F5AA6] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-[#1F5AA6]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#2B2B2B] mb-2">
                  Track Progress
                </h3>
                <p className="text-[#2B2B2B]">
                  Monitor your participation in events and activities
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#F4C430] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-[#F4C430]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#2B2B2B] mb-2">
                  Earn Rewards
                </h3>
                <p className="text-[#2B2B2B]">
                  Collect points and unlock achievements
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#2E8B57] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-[#2E8B57]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#2B2B2B] mb-2">
                  Stay Connected
                </h3>
                <p className="text-[#2B2B2B]">
                  Engage with college activities and events
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E6E9EE]">
              <button
                onClick={() => router.push("/signin")}
                className="bg-[#1F5AA6] hover:bg-[#3E7BCB] text-white font-bold text-lg py-4 px-12 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Footer info */}
          <p className="text-[#2B2B2B] text-sm">
            St. Martin Engineering College - Empowering Student Excellence
          </p>
        </div>
      </div>
    </div>
  );
}
