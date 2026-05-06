"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { useEffect } from "react";

export default function ProtectedRoute({ children }) {
  const { user, loading, connectionError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !connectionError) {
      router.push("/signin");
    }
  }, [user, loading, connectionError, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F5AA6]"></div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-[#E6E9EE] p-4">
        <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-lg shadow-lg border border-red-200">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Connection Error</h1>
            <p className="text-[#2B2B2B] mb-4">{connectionError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#1F5AA6] hover:bg-[#3E7BCB] text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
