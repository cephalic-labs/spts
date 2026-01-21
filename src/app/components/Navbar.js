"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useSignInModal } from "@/lib/SignInModalContext";
import { account } from "@/lib/appwrite";
import { useRouter, usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { user } = useAuth();
  const { openSignIn } = useSignInModal();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinkClass = (path) => `text-sm font-black uppercase tracking-widest transition-all ${pathname === path ? "text-primary text-glow" : "text-charcoal/50 hover:text-primary dark:text-white/40 dark:hover:text-white"}`;

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-cool-gray/30 dark:border-white/10 transition-all duration-300">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-500">
            <span className="text-white font-black text-2xl">S</span>
          </div>
          <span className="text-3xl font-black text-primary dark:text-white tracking-tighter group-hover:text-glow transition-all">SPTS</span>
        </Link>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8 pt-1">
            <Link href="/" className={navLinkClass("/")}>Home</Link>
            {user && <Link href="/dashboard" className={navLinkClass("/dashboard")}>Dashboard</Link>}
          </div>
          <div className="h-8 w-px bg-cool-gray/50 hidden md:block" />
          <div className="flex items-center gap-6">
            {user && (
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-charcoal font-black text-sm shadow-md hover:scale-110 transition-transform">
                {user.name?.[0] || user.email?.[0]?.toUpperCase()}
              </div>
            )}
            <ThemeToggle />
            {user ? (
              <button onClick={handleLogout} className="text-sm font-black uppercase tracking-widest text-critical/60 hover:text-critical transition-colors">Logout</button>
            ) : (
              <button onClick={openSignIn} className="btn-primary py-3 px-8 text-sm font-black uppercase tracking-widest">Sign In</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
