"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { account } from "@/lib/appwrite";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      router.push("/signin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isAuthPage = pathname === "/signin" || pathname === "/signup";

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-cool-gray/30">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-2xl font-bold text-primary tracking-tight">
            SPTS
          </span>
        </Link>

        {!isAuthPage && (
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === "/" ? "text-primary" : "text-charcoal hover:text-primary"
              }`}
            >
              Home
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    pathname === "/dashboard"
                      ? "text-primary"
                      : "text-charcoal hover:text-primary"
                  }`}
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-charcoal font-bold text-xs">
                    {user.name?.[0] || user.email?.[0]?.toUpperCase()}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-critical hover:underline"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link href="/signin" className="btn-primary py-2 px-5 text-sm">
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
