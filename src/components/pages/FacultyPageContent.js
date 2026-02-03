"use client";

import { useState, useEffect } from "react";
import { getFaculties, deleteFaculty } from "@/lib/services/facultyService";
import { Icons } from "@/components/layout";
import AddFacultyModal from "./AddFacultyModal";

export default function FacultyPageContent({ role }) {
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({ department: "", role: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState(null);

    useEffect(() => {
        loadFaculty();
    }, [filter]);

    async function loadFaculty() {
        try {
            setLoading(true);
            const response = await getFaculties(filter, 100);
            setFaculty(response.documents || []);
        } catch (err) {
            setError("Failed to load faculty");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleAdd = () => {
        setSelectedFaculty(null);
        setIsModalOpen(true);
    };

    const handleEdit = (member) => {
        setSelectedFaculty(member);
        setIsModalOpen(true);
    };

    const handleDelete = async (memberId) => {
        if (window.confirm("Are you sure you want to delete this faculty record?")) {
            try {
                await deleteFaculty(memberId);
                loadFaculty();
            } catch (error) {
                alert("Failed to delete faculty");
                console.error(error);
            }
        }
    };

    const canManageFaculty = ["sudo", "admin"].includes(role);

    if (loading && faculty.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-[#1E2761] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#1E2761]">Faculty</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and view faculty members</p>
                </div>
                {canManageFaculty && (
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1E2761] text-white rounded-xl hover:bg-[#2d3a7d] transition-colors shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Faculty
                    </button>
                )}
            </div>

            <AddFacultyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadFaculty}
                initialData={selectedFaculty}
            />

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <select
                    className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20"
                    value={filter.department}
                    onChange={(e) => setFilter({ ...filter, department: e.target.value })}
                >
                    <option value="">All Departments</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="IT">IT</option>
                    <option value="AIDS">AIDS</option>
                </select>
                <select
                    className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20"
                    value={filter.role}
                    onChange={(e) => setFilter({ ...filter, role: e.target.value })}
                >
                    <option value="">All Roles</option>
                    <option value="hod">HOD</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="advisor">Advisor</option>
                    <option value="mentor">Mentor</option>
                </select>
            </div>

            {/* Faculty Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {faculty.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icons.Faculty />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-2">No Faculty Found</h3>
                        <p className="text-gray-500">Try adjusting your filters or add a member.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F8F9FA] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Designation</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {faculty.map((member) => (
                                    <tr key={member.$id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-800">{member.name}</div>
                                            <div className="text-xs text-gray-400">{member.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-bold">{member.department}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-black uppercase tracking-wider">
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 italic">{member.designation}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-3">
                                            <button
                                                onClick={() => handleEdit(member)}
                                                className="text-[#1E2761] hover:underline text-xs font-black uppercase tracking-widest"
                                            >
                                                Edit
                                            </button>
                                            {role === "sudo" && (
                                                <button
                                                    onClick={() => handleDelete(member.$id)}
                                                    className="text-red-500 hover:underline text-xs font-black uppercase tracking-widest"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
