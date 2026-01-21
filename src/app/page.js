"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
      </div>
    );
  }

  // Prevent flash of content if redirecting
  if (user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#2B2B2B]">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white border-b border-[#E0E0E0] shadow-sm">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 relative flex-shrink-0">
              {/* Using standard img tag for simplicity with verified paths, or Next Image */}
              <img
                src="/sece_emblem.webp"
                alt="SECE Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-[#003366] leading-tight">
                Sri Eshwar College of Engineering
              </h1>
              <p className="text-xs text-[#2B2B2B] font-medium tracking-wide">
                STUDENT PARTICIPATION TRACKING SYSTEM
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/signin")}
            className="bg-[#003366] hover:bg-[#002147] text-white cursor-pointer px-6 py-2.5 rounded hover:shadow-md transition-all duration-200 font-medium text-sm"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-white relative overflow-hidden">
        {/* Abstract Institutional Background Element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#003366] opacity-[0.03] -skew-x-12 transform translate-x-32"></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="max-w-3xl">
            <div className="inline-block px-3 py-1 bg-[#F0F4F8] text-[#003366] text-xs font-semibold tracking-wider uppercase rounded mb-6 border border-[#E6E9EE]">
              Official Portal
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#003366] leading-tight mb-6">
              Centralized Participation <br /> On-Duty Management
            </h1>
            <p className="text-lg md:text-xl text-[#555] mb-8 leading-relaxed max-w-2xl">
              Streamlining the approval process for external events, competitions, and academic contributions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push("/signin")}
                className="bg-[#003366] hover:bg-[#002147] text-white cursor-pointer px-8 py-4 rounded text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Access Portal
              </button>
              <button
                className="bg-white border border-[#E0E0E0] cursor-pointer text-[#003366] hover:bg-[#F8F9FA] px-8 py-4 rounded text-base font-semibold transition-all duration-200"
              >
                View Guidelines
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Role Cards Section */}
      <section className="py-20 bg-[#F8F9FA] border-t border-[#E0E0E0]">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-2xl font-bold text-[#003366] mb-12 text-center">Platform Capabilities</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Student Card */}
            <div className="bg-white p-8 rounded border border-[#E0E0E0] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#F0F4F8] rounded flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#003366]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#2B2B2B] mb-3">For Students</h3>
              <ul className="space-y-3 text-[#555] text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5B358] mt-2 flex-shrink-0"></div>
                  <span>View approved upcoming events</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5B358] mt-2 flex-shrink-0"></div>
                  <span>Register for Hackathons & Conferences</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5B358] mt-2 flex-shrink-0"></div>
                  <span>Apply for On-Duty (OD) status digitally</span>
                </li>
              </ul>
            </div>

            {/* Faculty Card */}
            <div className="bg-white p-8 rounded border border-[#E0E0E0] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#F0F4F8] rounded flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#003366]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#2B2B2B] mb-3">For Coordinators</h3>
              <ul className="space-y-3 text-[#555] text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5B358] mt-2 flex-shrink-0"></div>
                  <span>Review participation requests</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5B358] mt-2 flex-shrink-0"></div>
                  <span>Verify event authenticity and value</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5B358] mt-2 flex-shrink-0"></div>
                  <span>Manage department nominations</span>
                </li>
              </ul>
            </div>

            {/* Admin Card */}
            <div className="bg-white p-8 rounded border border-[#E0E0E0] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#F0F4F8] rounded flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#003366]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#2B2B2B] mb-3">Administration (HODs/Principal)</h3>
              <ul className="space-y-3 text-[#555] text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5B358] mt-2 flex-shrink-0"></div>
                  <span>Final approval workflow</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5B358] mt-2 flex-shrink-0"></div>
                  <span>Generate participation reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5B358] mt-2 flex-shrink-0"></div>
                  <span>Monitor institutional performance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-2xl font-bold text-[#003366] mb-12 text-center">Supported Event Categories</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['Symposium', 'Conference', 'Hackathon', 'Competition', 'Workshop'].map((event) => (
              <div key={event} className="px-8 py-4 bg-[#F8F9FA] cursor-pointer rounded border border-[#E0E0E0] text-[#003366] font-semibold hover:bg-[#F0F4F8] transition-colors">
                {event}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Workflow Section */}
      <section className="py-20 bg-[#003366] text-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-2xl font-bold mb-16 text-center text-white">Application Workflow</h2>
          <div className="hidden md:flex justify-between items-center relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#ffffff30] -translate-y-1/2 z-0"></div>

            {/* Steps */}
            {[
              { title: "Event Listed", icon: "1" },
              { title: "Register", icon: "2" },
              { title: "Apply OD", icon: "3" },
              { title: "Advisor Review", icon: "4" },
              { title: "Coordinator Approval", icon: "5" },
              { title: "HOD Approval", icon: "6" }
            ].map((step, index) => (
              <div key={index} className="relative z-10 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#C5B358] text-[#003366] font-bold flex items-center justify-center mb-4 shadow-lg border-4 border-[#003366]">
                  {step.icon}
                </div>
                <div className="text-sm font-medium text-center text-[#E6E9EE] max-w-[100px]">{step.title}</div>
              </div>
            ))}
          </div>
          {/* Mobile Vertical Workflow */}
          <div className="md:hidden space-y-6">
            {[
              { title: "Event Listed", desc: "Browse approved events" },
              { title: "Student Registers", desc: "Register via official link" },
              { title: "On-Duty Applied", desc: "Submit request in portal" },
              { title: "Advisor Review", desc: "Initial verification" },
              { title: "Coordinator Approval", desc: "Department validation" },
              { title: "HOD Approval", desc: "Final authorization" }
            ].map((step, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#C5B358] text-[#003366] font-bold flex flex-shrink-0 items-center justify-center text-sm">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{step.title}</h4>
                  <p className="text-[#ffffff80] text-xs">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2B2B2B] text-white py-12 border-t border-[#3E3E3E]">
        <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-[#E6E9EE] mb-1">Sri Eshwar College of Engineering</h3>
            <p className="text-[#ffffff80] text-sm">Internal Academic Platform</p>
          </div>
          <p className="text-xs text-[#ffffff40]">
            © {new Date().getFullYear()} SECE. For internal use only.
          </p>
        </div>
      </footer>
    </div>
  );
}
