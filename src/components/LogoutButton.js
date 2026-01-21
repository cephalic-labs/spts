"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function LogoutButton({ className = "" }) {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    return (
        <button
            onClick={handleLogout}
            className={`bg-[#F4C430] hover:bg-[#C5B358] text-[#2B2B2B] font-semibold py-2 px-4 rounded transition-colors duration-200 ${className}`}
        >
            Logout
        </button>
    );
}
