"use client";

export default function StatCard({ icon, value, label, color }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-lg flex items-center justify-center ${color.bg} ${color.text} bg-opacity-10 text-white !opacity-100`}>
                <div className={`${color.bg} p-2.5 rounded-lg opacity-100 shadow-sm`}>
                    {icon}
                </div>
            </div>
            <div>
                <div className="text-3xl font-bold text-gray-800">{value}</div>
                <div className="text-sm text-gray-500 font-medium">{label}</div>
            </div>
        </div>
    );
}
