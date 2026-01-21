import { AuthProvider } from "@/lib/AuthContext";
import "./app.css";

export const metadata = {
  title: "SPTS - Student Participation Tracking System SECE",
  description: "SECE Student Participation Tracking System - Track your extracurricular participations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code&family=Inter:opsz,wght@14..32,100..900&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="bg-white font-[Inter] text-[#2B2B2B]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
