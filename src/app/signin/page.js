"use client";

import { account, OAuthProvider } from "@/lib/appwrite";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function SignIn() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = () => {
    const successUrl = `${window.location.origin}/dashboard`;
    const failureUrl = `${window.location.origin}/signin`;

    account.createOAuth2Session(OAuthProvider.Google, successUrl, failureUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-cool-gray/20 px-6 py-12 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-20 -mt-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -mr-20 -mb-20"></div>

      <div className="w-full max-w-md p-0 bg-white rounded-3xl shadow-2xl border border-cool-gray/50 overflow-hidden relative z-10 transition-transform hover:scale-[1.01]">
        <div className="bg-primary p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                <span className="text-white font-bold text-3xl">S</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
                Welcome Back
            </h1>
            <p className="text-white/80">
                Sign in to your SPTS account
            </p>
        </div>

        <div className="p-10">
            <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-4 bg-white hover:bg-cool-gray/30 text-charcoal font-bold py-4 px-6 rounded-2xl border-2 border-cool-gray transition-all duration-300 shadow-sm hover:shadow-md group"
            >
            <svg
                className="w-6 h-6 transition-transform group-hover:scale-110"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
                />
                <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
                />
                <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
                />
                <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
                />
            </svg>
            Sign in with Google
            </button>

            <div className="mt-10 pt-6 border-t border-cool-gray/50">
            <p className="text-xs text-charcoal/50 text-center leading-relaxed">
                By signing in, you agree to our <Link href="#" className="underline hover:text-primary">Terms of Service</Link> and <Link href="#" className="underline hover:text-primary">Privacy Policy</Link>. This portal is restricted to Sri Eshwar College of Engineering members.
            </p>
            </div>
        </div>
      </div>
    </div>
  );
}