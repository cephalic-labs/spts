"use client";

import { Icons } from "@/components/layout";

export default function ReportsPageContent({ role }) {
    const reports = [
        { title: "Participation Summary", type: "Visual Analysis", icon: <Icons.Dashboard />, color: "text-blue-600" },
        { title: "Monthly OD Trends", type: "Time-series", icon: <Icons.Reports />, color: "text-purple-600" },
        { title: "Department Comparison", type: "Comparative", icon: <Icons.Departments />, color: "text-orange-600" },
        { title: "Prize Money Analytics", type: "Financial", icon: <Icons.Certificate />, color: "text-emerald-600" },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#1E2761]">Reports & Analytics</h1>
                <p className="text-gray-500 text-sm mt-1">Generate and export system data</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {reports.map((report, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg transition-all group cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className={`p-4 rounded-2xl bg-gray-50 ${report.color} group-hover:scale-110 transition-transform`}>
                                {report.icon}
                            </div>
                            <button className="text-xs font-black text-gray-300 uppercase tracking-widest hover:text-[#1E2761] transition-colors">
                                Generate
                            </button>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-lg font-black text-[#1E2761] mb-1">{report.title}</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{report.type}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <h4 className="font-bold text-[#1E2761]">Recent Export History</h4>
                    <div className="text-xs text-gray-400">Showing last 5 exports</div>
                </div>
                <div className="p-12 text-center text-gray-400 italic text-sm">
                    No history found. Create your first report to see it here.
                </div>
            </div>
        </div>
    );
}
