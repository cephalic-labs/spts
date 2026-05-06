"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getStudents, deleteStudent } from "@/lib/services/studentService";
import { Icons } from "@/components/layout";
import AddStudentModal from "./AddStudentModal";
import Pagination from "@/components/ui/Pagination";
import ActionButtons from "@/components/ui/ActionButtons";
import {
  DEPARTMENTS_LIST,
  ADMIN_ADVISOR_ROLES,
  ADMIN_HOD_ADVISOR_ROLES,
} from "@/lib/dbConfig";
import { useDepartmentResolver } from "@/lib/hooks/useDepartmentResolver";
import { usePaginatedData } from "@/lib/hooks/usePaginatedData";

function getStudentTotalOD(student) {
  const totalCount =
    student?.od_count !== undefined && student?.od_count !== null
      ? parseInt(student.od_count, 10)
      : 7;
  return Number.isNaN(totalCount) ? 7 : totalCount;
}

export default function StudentsPageContent({ role }) {
  const { user } = useAuth();
  const [filter, setFilter] = useState({
    department: "",
    year: "",
    section: "",
    search: "",
    searchType: "name",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { userDepartment, deptResolved, needsDeptLock } = useDepartmentResolver(
    role,
    user,
  );

  const fetchStudents = useCallback(
    (offset, limit) => {
      // Wait for dept to be resolved before fetching (prevents showing all students before dept filter is applied)
      if (!deptResolved) return Promise.resolve({ documents: [], total: 0 });
      return getStudents(filter, limit, offset);
    },
    [filter.department, filter.year, filter.section, filter.search, filter.searchType, deptResolved],
  );

  const {
    data: students,
    total: totalStudents,
    loading,
    currentPage,
    setCurrentPage,
    reload,
  } = usePaginatedData(fetchStudents, [fetchStudents, deptResolved]);

  useEffect(() => {
    if (userDepartment) {
      setFilter((prev) => ({ ...prev, department: userDepartment }));
    }
  }, [userDepartment]);

  const handleAdd = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = async (studentId) => {
    if (
      window.confirm("Are you sure you want to delete this student record?")
    ) {
      try {
        await deleteStudent(studentId);
        reload();
      } catch (error) {
        alert("Failed to delete student");
        console.error(error);
      }
    }
  };

  const canManageStudents = ADMIN_ADVISOR_ROLES.includes(role);

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E2761] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2761]">Students</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and view student records
          </p>
        </div>
        {canManageStudents && (
          <button
            onClick={handleAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E2761] px-4 py-2.5 text-white shadow-sm transition-colors hover:bg-[#2d3a7d] sm:w-auto"
          >
            <Icons.Plus />
            Add Student
          </button>
        )}
      </div>

      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={reload}
        initialData={selectedStudent}
      />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder={`Search by ${filter.searchType}...`}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-4 pl-10 text-sm focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
            value={filter.search}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
          />
          <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
            <Icons.Search />
          </div>
        </div>
        <select
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
          value={filter.searchType}
          onChange={(e) =>
            setFilter({ ...filter, searchType: e.target.value, search: "" })
          }
        >
          <option value="name">Name</option>
          <option value="roll_no">Roll Number</option>
        </select>
        {!needsDeptLock ? (
          <select
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
            value={filter.department}
            onChange={(e) =>
              setFilter(prev => ({ ...prev, department: e.target.value }))
            }
          >
            <option value="">All Departments</option>
            {DEPARTMENTS_LIST.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        ) : (
          userDepartment && (
            <div className="flex items-center gap-2 rounded-lg bg-[#1E2761]/10 px-4 py-2 text-sm font-bold text-[#1E2761]">
              <Icons.Filter />
              {userDepartment}
            </div>
          )
        )}
        <select
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
          value={filter.year}
          onChange={(e) => setFilter(prev => ({ ...prev, year: e.target.value }))}
        >
          <option value="">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
        <select
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
          value={filter.section}
          onChange={(e) => setFilter(prev => ({ ...prev, section: e.target.value }))}
        >
          <option value="">All Sections</option>
          <option value="A">Section A</option>
          <option value="B">Section B</option>
          <option value="C">Section C</option>
          <option value="D">Section D</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {students.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Icons.Students />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-700">
              No Students Found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters or add a new student.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[100px]">
              <thead className="border-b border-gray-100 bg-[#F8F9FA]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Reg No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Dept/Year
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-500 uppercase">
                    CGPA
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Total OD
                  </th>
                  {canManageStudents && (
                    <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-gray-500 uppercase">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => (
                  <tr
                    key={student.$id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                      {student.student_register_no}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-800">
                        {student.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {student.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {student.department} / {student.year} Year{" "}
                      {student.section ? `- ${student.section}` : ""}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[#1E2761]">
                      {student.cgpa || "--"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {student.phone || "--"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                          getStudentTotalOD(student) > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {getStudentTotalOD(student)}
                      </span>
                    </td>
                    {canManageStudents && (
                      <td className="px-6 py-4 text-right">
                        <ActionButtons
                          onEdit={() => handleEdit(student)}
                          onDelete={
                            ADMIN_HOD_ADVISOR_ROLES.includes(role)
                              ? () => handleDelete(student.$id)
                              : null
                          }
                          editTitle="Edit Student"
                          deleteTitle="Delete Student"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {students.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalStudents}
            itemsPerPage={50}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
