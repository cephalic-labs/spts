import { AuthProvider } from "@/lib/AuthContext";
import { Inter, Poppins, Fira_Code } from "next/font/google";
import "./app.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ weight: ["300", "400", "500", "600", "700"], subsets: ["latin"], variable: "--font-poppins" });
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-fira-code" });

export const metadata = {
  title: "SPTS - Student Participation Tracking System SECE",
  description: "SECE Student Participation Tracking System - Track your extracurricular participations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${firaCode.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className={`${inter.className} bg-white text-[#2B2B2B]`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
