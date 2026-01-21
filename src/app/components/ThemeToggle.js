"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.theme === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
      setDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
      setDark(true);
    }
  };

  // Prevent hydration mismatch by rendering a placeholder during SSR
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-cool-gray/30 dark:bg-white/10 border border-cool-gray/50 dark:border-white/10"></div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-cool-gray/30 dark:bg-white/10 hover:bg-cool-gray/50 dark:hover:bg-white/20 border border-cool-gray/50 dark:border-white/10 transition-all duration-300 hover:scale-105"
      aria-label="Toggle Theme"
    >
      {dark ? (
        <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}
