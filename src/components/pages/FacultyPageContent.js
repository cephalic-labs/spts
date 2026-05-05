"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getFaculties, deleteFaculty } from "@/lib/services/facultyService";
import { Icons } from "@/components/layout";
import AddFacultyModal from "./AddFacultyModal";
import AssignAdminModal from "./AssignAdminModal";
import Pagination from "@/components/ui/Pagination";
import { getAdminFacultyFromLabels } from "@/actions/auth";
import { DEPARTMENTS_LIST } from "@/lib/dbConfig";
import { useDepartmentResolver } from "@/lib/hooks/useDepartmentResolver";
import { usePaginatedData } from "@/lib/hooks/usePaginatedData";

export default function FacultyPageContent({ role, filterRole }) {
    const { user } = useAuth();
    const [filter, setFilter] = useState({ department: "", role: filterRole || "", search: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState(null);

    const { userDepartment, deptResolved, needsDeptLock } = useDepartmentResolver(role, user);

    const fetchFaculty = useCallback(async (offset, limit) => {
        if (filterRole === "admin") {
            const adminList = await getAdminFacultyFromLabels();
            return { documents: adminList || [], total: adminList?.length || 0 };
        }
        return getFaculties(filter, limit, offset);
    }, [filter, filterRole]);

    const { 
        data: faculty, 
        total: totalFaculty, 
        loading, 
        currentPage, 
        setCurrentPage, 
        reload 
    } = usePaginatedData(fetchFaculty, [filter, deptResolved]);

    useEffect(() => {
        if (userDepartment) {
            setFilter(prev => ({ ...prev, department: userDepartment }));
        }
    }, [userDepartment]);

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
                reload();
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
                            <Icons.Plus />
                            {filterRole === "admin" ? "Add New Admin" : "Add Faculty"}
                        </button>
                        {filterRole === "admin" && canManageFaculty && (
                            <button
                                onClick={() => setIsAssignModalOpen(true)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#1E2761] text-[#1E2761] rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-bold"
                            >
                                <Icons.UserPlus />
                                Assign Existing
                            </button>
                        )}
                    </div>
                )}
            </div>

            <AddFacultyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={reload}
                initialData={selectedFaculty}
                preselectedRole={filterRole}
            />

            <AssignAdminModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onSuccess={reload}
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
                        <Icons.Search />
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
                        <Icons.Filter />
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
                                    {canManageFaculty && <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>}
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
                                        {canManageFaculty && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(member)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit Faculty"
                                                    >
                                                        <Icons.Edit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(member.$id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Faculty"
                                                    >
                                                        <Icons.Trash />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {faculty.length > 0 && filterRole !== "admin" && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalFaculty}
                        itemsPerPage={50}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
        </div>
    );
}
