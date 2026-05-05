import { useState, useEffect } from "react";
import { getFacultyByAppwriteId, getFacultyByEmail } from "../services/facultyService";

export function useDepartmentResolver(role, user, lockedRoles = ["sudo", "admin", "student"]) {
  const [userDepartment, setUserDepartment] = useState(null);
  const [deptResolved, setDeptResolved] = useState(lockedRoles.includes(role));
  const needsDeptLock = !lockedRoles.includes(role);

  useEffect(() => {
    if (!needsDeptLock || !user?.$id) return;
    async function resolve() {
      try {
        let faculty = await getFacultyByAppwriteId(user.$id);
        if (!faculty && user.email) faculty = await getFacultyByEmail(user.email);
        if (faculty?.department) setUserDepartment(faculty.department);
      } finally {
        setDeptResolved(true);
      }
    }
    resolve();
  }, [needsDeptLock, user?.$id, user?.email]);

  return { userDepartment, deptResolved, needsDeptLock };
}
