"use client";

import ProtectedRoute from "@/lib/ProtectedRoute";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-white to-[#E6E9EE]">
        {/* Header */}
        <header className="bg-[#1F5AA6] text-white shadow-md">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">SPTS Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm">
                Welcome, {user?.name || user?.email || "User"}
              </span>
              <button
                onClick={handleLogout}
                className="bg-[#F4C430] hover:bg-[#F4A261] text-[#2B2B2B] font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-lg border border-[#E6E9EE] p-6 mb-6">
            <h2 className="text-3xl font-bold text-[#1F5AA6] mb-4">
              Welcome to Your Dashboard!
            </h2>
            <p className="text-[#2B2B2B] text-lg mb-4">
              Track your participation and achievements in student activities.
            </p>
            <div className="flex items-center gap-2 text-[#2E8B57]">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold">Successfully authenticated</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md border border-[#E6E9EE] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#2B2B2B]">
                  Events Attended
                </h3>
                <div className="w-12 h-12 bg-[#1F5AA6] bg-opacity-10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#1F5AA6]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#1F5AA6]">0</p>
              <p className="text-sm text-[#2B2B2B] mt-1">This semester</p>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-[#E6E9EE] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#2B2B2B]">
                  Participation Points
                </h3>
                <div className="w-12 h-12 bg-[#F4C430] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#F4C430]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#F4C430]">0</p>
              <p className="text-sm text-[#2B2B2B] mt-1">Total earned</p>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-[#E6E9EE] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#2B2B2B]">
                  Achievements
                </h3>
                <div className="w-12 h-12 bg-[#2E8B57] bg-opacity-10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#2E8B57]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#2E8B57]">0</p>
              <p className="text-sm text-[#2B2B2B] mt-1">Unlocked</p>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="mt-6 bg-white rounded-lg shadow-lg border border-[#E6E9EE] p-6">
            <h3 className="text-xl font-bold text-[#1F5AA6] mb-4">
              Recent Activity
            </h3>
            <div className="text-center py-8 text-[#2B2B2B]">
              <p>No recent activity to display.</p>
              <p className="text-sm mt-2">
                Start participating in events to see your activity here!
              </p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}