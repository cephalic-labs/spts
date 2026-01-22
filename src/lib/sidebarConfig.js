// Role-based sidebar navigation configuration
// Each role has its own set of menu items with icons and routes

export const sidebarConfig = {
    sudo: [
        { name: "Dashboard", path: "/dashboard/sudo", icon: "Dashboard" },
        { name: "Events", path: "/dashboard/sudo/events", icon: "Events" },
        { name: "Submissions", path: "/dashboard/sudo/submissions", icon: "Submissions" },
        { name: "Approvals", path: "/dashboard/sudo/approvals", icon: "Approvals" },
        { name: "Reports", path: "/dashboard/sudo/reports", icon: "Reports" },
        { name: "Students", path: "/dashboard/sudo/students", icon: "Students" },
        { name: "Faculty", path: "/dashboard/sudo/faculty", icon: "Faculty" },
        { name: "Departments", path: "/dashboard/sudo/departments", icon: "Departments" },
        { name: "Excel Import", path: "/dashboard/sudo/import", icon: "Import" },
        { name: "Settings", path: "/dashboard/sudo/settings", icon: "Settings" },
    ],
    admin: [
        { name: "Dashboard", path: "/dashboard/admin", icon: "Dashboard" },
        { name: "Users", path: "/dashboard/admin/users", icon: "Faculty" },
        { name: "Events", path: "/dashboard/admin/events", icon: "Events" },
        { name: "Approvals", path: "/dashboard/admin/approvals", icon: "Approvals" },
        { name: "Reports", path: "/dashboard/admin/reports", icon: "Reports" },
        { name: "Departments", path: "/dashboard/admin/departments", icon: "Departments" },
        { name: "Settings", path: "/dashboard/admin/settings", icon: "Settings" },
    ],
    principal: [
        { name: "Dashboard", path: "/dashboard/principal", icon: "Dashboard" },
        { name: "Overview", path: "/dashboard/principal/overview", icon: "Analytics" },
        { name: "Approvals", path: "/dashboard/principal/approvals", icon: "Approvals" },
        { name: "Reports", path: "/dashboard/principal/reports", icon: "Reports" },
        { name: "Departments", path: "/dashboard/principal/departments", icon: "Departments" },
    ],
    hod: [
        { name: "Dashboard", path: "/dashboard/hod", icon: "Dashboard" },
        { name: "Department", path: "/dashboard/hod/department", icon: "Departments" },
        { name: "Faculty", path: "/dashboard/hod/faculty", icon: "Faculty" },
        { name: "Students", path: "/dashboard/hod/students", icon: "Students" },
        { name: "Approvals", path: "/dashboard/hod/approvals", icon: "Approvals" },
        { name: "Reports", path: "/dashboard/hod/reports", icon: "Reports" },
    ],
    coordinator: [
        { name: "Dashboard", path: "/dashboard/coordinator", icon: "Dashboard" },
        { name: "Events", path: "/dashboard/coordinator/events", icon: "Events" },
        { name: "Submissions", path: "/dashboard/coordinator/submissions", icon: "Submissions" },
        { name: "Review", path: "/dashboard/coordinator/review", icon: "Review" },
        { name: "Approvals", path: "/dashboard/coordinator/approvals", icon: "Approvals" },
        { name: "Reports", path: "/dashboard/coordinator/reports", icon: "Reports" },
    ],
    advisor: [
        { name: "Dashboard", path: "/dashboard/advisor", icon: "Dashboard" },
        { name: "Mentees", path: "/dashboard/advisor/mentees", icon: "Mentees" },
        { name: "Submissions", path: "/dashboard/advisor/submissions", icon: "Submissions" },
        { name: "Approvals", path: "/dashboard/advisor/approvals", icon: "Approvals" },
        { name: "Reports", path: "/dashboard/advisor/reports", icon: "Reports" },
    ],
    mentor: [
        { name: "Dashboard", path: "/dashboard/mentor", icon: "Dashboard" },
        { name: "Mentees", path: "/dashboard/mentor/mentees", icon: "Mentees" },
        { name: "Submissions", path: "/dashboard/mentor/submissions", icon: "Submissions" },
        { name: "Approvals", path: "/dashboard/mentor/approvals", icon: "Approvals" },
        { name: "Reports", path: "/dashboard/mentor/reports", icon: "Reports" },
    ],
    student: [
        { name: "Dashboard", path: "/dashboard/student", icon: "Dashboard" },
        { name: "My Events", path: "/dashboard/student/events", icon: "MyEvents" },
        { name: "Submissions", path: "/dashboard/student/submissions", icon: "Submissions" },
        { name: "Certificates", path: "/dashboard/student/certificates", icon: "Certificate" },
        { name: "Profile", path: "/dashboard/student/profile", icon: "Profile" },
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
