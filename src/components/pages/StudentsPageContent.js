"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getStudents, deleteStudent } from "@/lib/services/studentService";
import { getFacultyByAppwriteId, getFacultyByEmail } from "@/lib/services/facultyService";
import { Icons } from "@/components/layout";
import AddStudentModal from "./AddStudentModal";
import { DEPARTMENTS_LIST } from "@/lib/dbConfig";

export default function StudentsPageContent({ role }) {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({ department: "", year: "" });
    const [userDepartment, setUserDepartment] = useState(null);
    const [deptResolved, setDeptResolved] = useState(["sudo", "admin", "student"].includes(role));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const needsDeptLock = !["sudo", "admin", "student"].includes(role);

    // Resolve department for faculty roles
    useEffect(() => {
        if (!needsDeptLock || !user?.$id) return;

        async function resolveDepartment() {
            try {
                let faculty = await getFacultyByAppwriteId(user.$id);
                if (!faculty && user.email) {
                    faculty = await getFacultyByEmail(user.email);
                }

                if (faculty?.department) {
                    setUserDepartment(faculty.department);
                    setFilter(prev => ({ ...prev, department: faculty.department }));
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
        loadStudents();
    }, [filter, deptResolved]);

    async function loadStudents() {
        try {
            setLoading(true);
            const response = await getStudents(filter, 100);
            setStudents(response.documents || []);
        } catch (err) {
            setError("Failed to load students");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleAdd = () => {
        setSelectedStudent(null);
        setIsModalOpen(true);
    };

    const handleEdit = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const handleDelete = async (studentId) => {
        if (window.confirm("Are you sure you want to delete this student record?")) {
            try {
                await deleteStudent(studentId);
                loadStudents();
            } catch (error) {
                alert("Failed to delete student");
                console.error(error);
            }
        }
    };

    const canManageStudents = ["sudo", "admin", "coordinator"].includes(role);

    if (loading && students.length === 0) {
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
                    <h1 className="text-2xl font-bold text-[#1E2761]">Students</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and view student records</p>
                </div>
                {canManageStudents && (
                    <button
                        onClick={handleAdd}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E2761] text-white rounded-xl hover:bg-[#2d3a7d] transition-colors shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Student
                    </button>
                )}
            </div>

            <AddStudentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadStudents}
                initialData={selectedStudent}
            />

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
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
                <select
                    className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20"
                    value={filter.year}
                    onChange={(e) => setFilter({ ...filter, year: e.target.value })}
                >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                </select>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {students.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icons.Students />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-2">No Students Found</h3>
                        <p className="text-gray-500">Try adjusting your filters or add a new student.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[920px]">
                            <thead className="bg-[#F8F9FA] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reg No</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dept/Year</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">CGPA</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {students.map((student) => (
                                    <tr key={student.$id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600">{student.student_register_no}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-800">{student.name}</div>
                                            <div className="text-xs text-gray-400">{student.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {student.department} / {student.year} Year
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-[#1E2761]">
                                            {student.cgpa || "--"}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {student.phone || "--"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleEdit(student)}
                                                    className="text-[#1E2761] hover:underline text-xs font-black uppercase tracking-widest"
                                                >
                                                    Edit
                                                </button>
                                                {["sudo", "admin", "hod"].includes(role) && (
                                                    <button
                                                        onClick={() => handleDelete(student.$id)}
                                                        className="text-red-500 hover:underline text-xs font-black uppercase tracking-widest"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
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
