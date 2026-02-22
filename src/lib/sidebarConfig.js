// Role-based sidebar navigation configuration
// Each role has its own set of menu items with icons and routes

export const sidebarConfig = {
    sudo: [
        { name: "Dashboard", path: "/dashboard/sudo", icon: "Dashboard" },
        { name: "Events", path: "/dashboard/sudo/events", icon: "Events" },
        { name: "Submissions", path: "/dashboard/sudo/submissions", icon: "Submissions" },
        { name: "Approvals", path: "/dashboard/sudo/approvals", icon: "Approvals" },
        { name: "Students", path: "/dashboard/sudo/students", icon: "Students" },
        { name: "Faculty", path: "/dashboard/sudo/faculty", icon: "Faculty" },
        { name: "Departments", path: "/dashboard/sudo/departments", icon: "Departments" },
        { name: "Excel Import", path: "/dashboard/sudo/import", icon: "Import" },
        { name: "Settings", path: "/dashboard/sudo/settings", icon: "Settings" },
        { name: "Admins", path: "/dashboard/sudo/admins", icon: "Faculty" },
    ],
    admin: [
        { name: "Dashboard", path: "/dashboard/admin", icon: "Dashboard" },
        { name: "Events", path: "/dashboard/admin/events", icon: "Events" },
        { name: "Submissions", path: "/dashboard/admin/submissions", icon: "Submissions" },
        { name: "Approvals", path: "/dashboard/admin/approvals", icon: "Approvals" },
        { name: "Students", path: "/dashboard/admin/students", icon: "Students" },
        { name: "Faculty", path: "/dashboard/admin/faculty", icon: "Faculty" },
        { name: "Departments", path: "/dashboard/admin/departments", icon: "Departments" },
        { name: "Settings", path: "/dashboard/admin/settings", icon: "Settings" },
    ],
    advisor: [
        { name: "Dashboard", path: "/dashboard/advisor", icon: "Dashboard" },
        { name: "Events", path: "/dashboard/advisor/events", icon: "Events" },
        { name: "Submissions", path: "/dashboard/advisor/submissions", icon: "Submissions" },
        { name: "Approvals", path: "/dashboard/advisor/approvals", icon: "Approvals" },
        { name: "Students", path: "/dashboard/advisor/students", icon: "Students" },
        { name: "Class", path: "/dashboard/advisor/class", icon: "Departments" },
        { name: "Settings", path: "/dashboard/advisor/settings", icon: "Settings" },
    ],
    coordinator: [
        { name: "Dashboard", path: "/dashboard/coordinator", icon: "Dashboard" },
        { name: "Events", path: "/dashboard/coordinator/events", icon: "Events" },
        { name: "Submissions", path: "/dashboard/coordinator/submissions", icon: "Submissions" },
        { name: "Approvals", path: "/dashboard/coordinator/approvals", icon: "Approvals" },
        { name: "Students", path: "/dashboard/coordinator/students", icon: "Students" },
        { name: "Department", path: "/dashboard/coordinator/department", icon: "Departments" },
        { name: "Settings", path: "/dashboard/coordinator/settings", icon: "Settings" },
    ],
    hod: [
        { name: "Dashboard", path: "/dashboard/hod", icon: "Dashboard" },
        { name: "Events", path: "/dashboard/hod/events", icon: "Events" },
        { name: "Submissions", path: "/dashboard/hod/submissions", icon: "Submissions" },
        { name: "Approvals", path: "/dashboard/hod/approvals", icon: "Approvals" },
        { name: "Students", path: "/dashboard/hod/students", icon: "Students" },
        { name: "Department", path: "/dashboard/hod/department", icon: "Departments" },
        { name: "Settings", path: "/dashboard/hod/settings", icon: "Settings" },
        { name: "Faculty", path: "/dashboard/hod/faculty", icon: "Faculty" },
    ],
    mentor: [
        { name: "Dashboard", path: "/dashboard/mentor", icon: "Dashboard" },
        { name: "Events", path: "/dashboard/mentor/events", icon: "Events" },
        { name: "Submissions", path: "/dashboard/mentor/submissions", icon: "Submissions" },
        { name: "Approvals", path: "/dashboard/mentor/approvals", icon: "Approvals" },
        { name: "Students", path: "/dashboard/mentor/students", icon: "Students" },
        { name: "Department", path: "/dashboard/mentor/department", icon: "Departments" },
        { name: "Settings", path: "/dashboard/mentor/settings", icon: "Settings" },
    ],
    principal: [
        { name: "Dashboard", path: "/dashboard/principal", icon: "Dashboard" },
        { name: "Events", path: "/dashboard/principal/events", icon: "Events" },
        { name: "Submissions", path: "/dashboard/principal/submissions", icon: "Submissions" },
        { name: "Approvals", path: "/dashboard/principal/approvals", icon: "Approvals" },
        { name: "Students", path: "/dashboard/principal/students", icon: "Students" },
        { name: "Faculty", path: "/dashboard/principal/faculty", icon: "Faculty" },
        { name: "Departments", path: "/dashboard/principal/departments", icon: "Departments" },
        { name: "Settings", path: "/dashboard/principal/settings", icon: "Settings" },
    ],
    student: [
        { name: "Dashboard", path: "/dashboard/student", icon: "Dashboard" },
        { name: "Events", path: "/dashboard/student/events", icon: "Events" },
        { name: "Submissions", path: "/dashboard/student/submissions", icon: "Submissions" },
        { name: "Approvals", path: "/dashboard/student/approvals", icon: "Approvals" },
        { name: "Settings", path: "/dashboard/student/settings", icon: "Settings" },
    ],
};

// Get portal title based on role
export const getPortalTitle = (role) => {
    const titles = {
        sudo: "Super Admin Portal",
        admin: "Admin Portal",
        principal: "Principal Portal",
        hod: "HOD Portal",
        coordinator: "Coordinator Portal",
        advisor: "Advisor Portal",
        mentor: "Mentor Portal",
        student: "Student Portal",
    };
    return titles[role] || "Dashboard";
};

// Get default role display name
export const getRoleDisplayName = (role) => {
    const names = {
        sudo: "Super Admin",
        admin: "Administrator",
        principal: "Principal",
        hod: "Head of Department",
        coordinator: "Coordinator",
        advisor: "Advisor",
        mentor: "Mentor",
        student: "Student",
    };
    return names[role] || "User";
};

// Valid roles for validation
export const validRoles = ["sudo", "admin", "student", "mentor", "advisor", "coordinator", "hod", "principal"];

export default sidebarConfig;
