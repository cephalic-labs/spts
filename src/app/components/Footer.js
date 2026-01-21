"use client";

import Link from "next/link";
import { useSignInModal } from "@/lib/SignInModalContext";

export default function Footer() {
  const { openSignIn } = useSignInModal();

  return (
    <footer className="bg-[var(--card-bg)] border-t border-[var(--card-border)] text-[var(--text-color)] py-12 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center border border-white/20">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold tracking-tight">SPTS</span>
            </div>
            <p className="opacity-60 max-w-sm">
              Sri Eshwar College of Engineering Student Participation Tracking System. 
              Empowering students to track their academic journey and achievements.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-primary dark:text-accent">Quick Links</h4>
            <ul className="space-y-2 opacity-60">
              <li><Link href="/" className="hover:text-primary dark:hover:text-white transition-colors">Home</Link></li>
              <li><button onClick={openSignIn} className="hover:text-primary dark:hover:text-white transition-colors">Sign In</button></li>
              <li><Link href="/dashboard" className="hover:text-primary dark:hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-primary dark:text-accent">Contact</h4>
            <ul className="space-y-2 opacity-60">
              <li>Sri Eshwar College of Engineering</li>
              <li>Kondampatti, Tamil Nadu</li>
              <li>India</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-[var(--card-border)] text-center opacity-40 text-sm">
          <p>© {new Date().getFullYear()} SECE SPTS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
