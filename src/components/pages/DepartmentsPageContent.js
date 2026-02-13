"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/layout";
import { getDepartments } from "@/lib/services/departmentService";
import AddDepartmentModal from "./AddDepartmentModal";

export default function DepartmentsPageContent({ role }) {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null);

    useEffect(() => {
        loadDepartments();
    }, []);

    async function loadDepartments() {
        try {
            setLoading(true);
            const response = await getDepartments();
            setDepartments(response.documents || []);
        } catch (error) {
            console.error("Error loading departments:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleAdd = () => {
        setSelectedDept(null);
        setIsModalOpen(true);
    };

    const handleEdit = (dept) => {
        setSelectedDept(dept);
        setIsModalOpen(true);
    };

    if (loading && departments.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-[#1E2761] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#1E2761]">Departments</h1>
                    <p className="text-gray-500 text-sm mt-1">Institution organizational structure</p>
                </div>
                {role === "sudo" && (
                    <button
                        onClick={handleAdd}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E2761] text-white rounded-xl hover:bg-[#2d3a7d] transition-colors shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Department
                    </button>
                )}
            </div>

            <AddDepartmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadDepartments}
                initialData={selectedDept}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {departments.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-400 font-medium">
                        No departments found. Add your first department to get started.
                    </div>
                ) : (
                    departments.map((dept) => (
                        <div key={dept.$id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Icons.Departments />
                                </div>
                                {role === "sudo" && (
                                    <button
                                        onClick={() => handleEdit(dept)}
                                        className="text-gray-300 hover:text-[#1E2761] uppercase text-[10px] font-black tracking-widest"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            <h3 className="text-xl font-black text-[#1E2761] mb-1">{dept.name}</h3>
                            <p className="text-xs text-gray-400 font-bold mb-4 uppercase tracking-wider line-clamp-1">HOD: {dept.hod_name || "Unassigned"}</p>

                            <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                                <div>
                                    <div className="text-lg font-bold text-gray-800">--</div>
                                    <div className="text-[10px] text-gray-400 uppercase font-bold">Students</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-gray-800">--</div>
                                    <div className="text-[10px] text-gray-400 uppercase font-bold">Faculty</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
