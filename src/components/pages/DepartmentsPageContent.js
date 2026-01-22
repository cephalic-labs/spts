"use client";

import { Icons } from "@/components/layout";

export default function DepartmentsPageContent({ role }) {
    // Static list for now
    const departments = [
        { name: "CSE", head: "Dr. Smith", students: 120, faculty: 15 },
        { name: "ECE", head: "Dr. Jones", students: 100, faculty: 12 },
        { name: "EEE", head: "Dr. Brown", students: 80, faculty: 10 },
        { name: "IT", head: "Dr. White", students: 90, faculty: 11 },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#1E2761]">Departments</h1>
                    <p className="text-gray-500 text-sm mt-1">Institution organizational structure</p>
                </div>
                {role === "sudo" && (
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E2761] text-white rounded-xl hover:bg-[#2d3a7d] transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Department
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {departments.map((dept) => (
                    <div key={dept.name} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                            <Icons.Departments />
                        </div>
                        <h3 className="text-xl font-black text-[#1E2761] mb-1">{dept.name}</h3>
                        <p className="text-xs text-gray-400 font-bold mb-4 uppercase tracking-wider">HOD: {dept.head}</p>

                        <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                            <div>
                                <div className="text-lg font-bold text-gray-800">{dept.students}</div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold">Students</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-gray-800">{dept.faculty}</div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold">Faculty</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
