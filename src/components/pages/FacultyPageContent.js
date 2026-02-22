"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getFaculties, deleteFaculty, getFacultyByAppwriteId, getFacultyByEmail } from "@/lib/services/facultyService";
import { Icons } from "@/components/layout";
import AddFacultyModal from "./AddFacultyModal";
import AssignAdminModal from "./AssignAdminModal";
import { getAdminFacultyFromLabels } from "@/actions/auth";
import { DEPARTMENTS_LIST } from "@/lib/dbConfig";

export default function FacultyPageContent({ role, filterRole }) {
    const { user } = useAuth();
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({ department: "", role: filterRole || "", search: "" });
    const [userDepartment, setUserDepartment] = useState(null);
    const [deptResolved, setDeptResolved] = useState(["sudo", "admin"].includes(role));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState(null);

    const needsDeptLock = !["sudo", "admin"].includes(role);

    // Resolve department for faculty roles
    useEffect(() => {
        if (!needsDeptLock || !user?.$id) return;

        async function resolveDepartment() {
            try {
                let currentFaculty = await getFacultyByAppwriteId(user.$id);
                if (!currentFaculty && user.email) {
                    currentFaculty = await getFacultyByEmail(user.email);
                }

                if (currentFaculty?.department) {
                    setUserDepartment(currentFaculty.department);
                    setFilter(prev => ({ ...prev, department: currentFaculty.department }));
                }
            } catch (err) {
                console.error("[Dept Resolution] Error:", err);
            } finally {
                setDeptResolved(true);
            }
        }

        resolveDepartment();
    }, [role, user?.$id, user?.email]);

    useEffect(() => {
        if (!deptResolved) return;
        loadFaculty();
    }, [filter, deptResolved]);

    async function loadFaculty() {
        try {
            setLoading(true);
            if (filterRole === "admin") {
                const adminList = await getAdminFacultyFromLabels();
                setFaculty(adminList || []);
            } else {
                const response = await getFaculties(filter, 100);
                setFaculty(response.documents || []);
            }
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

    const canManageFaculty = ["sudo", "admin", "hod"].includes(role);

    if (loading && faculty.length === 0) {
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
                    <h1 className="text-2xl font-bold text-[#1E2761]">{filterRole === "admin" ? "Admins" : "Faculty"}</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and view faculty members</p>
                </div>
                {canManageFaculty && (
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleAdd}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E2761] text-white rounded-xl hover:bg-[#2d3a7d] transition-colors shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {filterRole === "admin" ? "Add New Admin" : "Add Faculty"}
                        </button>
                        {filterRole === "admin" && canManageFaculty && (
                            <button
                                onClick={() => setIsAssignModalOpen(true)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#1E2761] text-[#1E2761] rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-bold"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                Assign Existing
                            </button>
                        )}
                    </div>
                )}
            </div>

            <AddFacultyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadFaculty}
                initialData={selectedFaculty}
                preselectedRole={filterRole}
            />

            <AssignAdminModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onSuccess={loadFaculty}
            />

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="relative w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="Search by name..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20"
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                {!needsDeptLock ? (
                    <select
                        className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20"
                        value={filter.department}
                        onChange={(e) => setFilter({ ...filter, department: e.target.value })}
                    >
                        <option value="">All Departments</option>
                        {DEPARTMENTS_LIST.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                ) : userDepartment && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#1E2761]/10 text-[#1E2761] rounded-lg text-sm font-bold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        {userDepartment}
                    </div>
                )}
                {!filterRole && (
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
                        <option value="part-time">Part-Time</option>
                        <option value="admin">Admin</option>
                    </select>
                )}
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
                        <table className="w-full min-w-[860px]">
                            <thead className="bg-[#F8F9FA] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Designation</th>
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
                                            <div className="flex flex-wrap gap-1">
                                                {(Array.isArray(member.role) ? member.role : [member.role]).map((r, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-black uppercase tracking-wider">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 italic">{member.designation}</td>
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
