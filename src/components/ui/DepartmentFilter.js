import { DEPARTMENTS_LIST } from "@/lib/dbConfig";
import { Icons } from "@/components/layout";

export function DepartmentFilter({ needsDeptLock, userDepartment, value, onChange }) {
  if (needsDeptLock && userDepartment) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-[#1E2761]/10 text-[#1E2761] rounded-lg text-sm font-bold">
        <Icons.Filter />
        {userDepartment}
      </div>
    );
  }

  return (
    <select
      className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20"
      value={value}
      onChange={onChange}
    >
      <option value="">All Departments</option>
      {DEPARTMENTS_LIST.map(dept => (
        <option key={dept} value={dept}>{dept}</option>
      ))}
    </select>
  );
}
