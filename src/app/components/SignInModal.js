"use client";

import { account, OAuthProvider } from "@/lib/appwrite";
import { useEffect, useRef } from "react";

export default function SignInModal({ isOpen, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleGoogleSignIn = () => {
    const successUrl = `${window.location.origin}/dashboard`;
    const failureUrl = `${window.location.origin}`;

    account.createOAuth2Session(OAuthProvider.Google, successUrl, failureUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md mx-4 bg-[var(--card-bg)] rounded-[2.5rem] shadow-2xl border border-[var(--card-border)] dark:border-white/5 overflow-hidden z-10 animate-scaleIn"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-90"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-primary p-12 text-center relative overflow-hidden">
          {/* Animated bg circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-pulse-slow" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 animate-pulse-slow" style={{ animationDelay: '1s' }} />
          
          <div className="w-20 h-20 bg-white/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/30 animate-float">
            <span className="text-white font-black text-4xl">S</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-white/80 text-lg">
            Sign in to your SPTS account
          </p>
        </div>

        {/* Content */}
        <div className="p-12">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-4 bg-[var(--bg-color)] hover:bg-cool-gray/20 dark:hover:bg-white/5 text-[var(--text-color)] font-black text-lg py-5 px-8 rounded-2xl border-2 border-[var(--card-border)] dark:border-white/10 transition-all duration-300 shadow-sm hover:shadow-xl group/btn active:scale-95"
          >
            <div className="bg-white p-2 rounded-lg shadow-sm group-hover/btn:scale-110 transition-transform">
              <svg
                className="w-6 h-6"
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
            </div>
            Sign in with Google
          </button>

          <div className="mt-12 pt-8 border-t border-cool-gray/50 dark:border-white/10">
            <p className="text-sm opacity-50 text-center leading-relaxed font-medium">
              By signing in, you agree to our{" "}
              <a href="#" className="underline hover:text-primary transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-primary transition-colors">
                Privacy Policy
              </a>
              . This portal is restricted to Sri Eshwar College of Engineering members.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
