// Centralized page configuration for all dashboard pages
// Used by dynamic routes to render appropriate content

export const pageConfig = {
    // Sudo pages
    "sudo/events": { title: "Events", description: "Manage all system events.", icon: "Events" },
    "sudo/submissions": { title: "Submissions", description: "View all participation submissions.", icon: "Submissions" },
    "sudo/approvals": { title: "Approvals", description: "Review and approve pending submissions.", icon: "Approvals" },
    "sudo/reports": { title: "Reports", description: "Generate comprehensive reports.", icon: "Reports" },
    "sudo/students": { title: "Students", description: "Manage student records.", icon: "Students" },
    "sudo/faculty": { title: "Faculty", description: "Manage faculty accounts.", icon: "Faculty" },
    "sudo/departments": { title: "Departments", description: "Configure departments.", icon: "Departments" },
    "sudo/import": { title: "Excel Import", description: "Bulk import data from Excel.", icon: "Import" },
    "sudo/settings": { title: "Settings", description: "System-wide settings.", icon: "Settings" },
    "sudo/admins": { title: "Admins", description: "Manage admin accounts.", icon: "Faculty" },

    // Admin pages
    "admin/events": { title: "Events", description: "Manage events.", icon: "Events" },
    "admin/submissions": { title: "Submissions", description: "View submissions.", icon: "Submissions" },
    "admin/approvals": { title: "Approvals", description: "Review approvals.", icon: "Approvals" },
    "admin/reports": { title: "Reports", description: "View reports.", icon: "Reports" },
    "admin/students": { title: "Students", description: "Manage students.", icon: "Students" },
    "admin/faculty": { title: "Faculty", description: "Manage faculty.", icon: "Faculty" },
    "admin/departments": { title: "Departments", description: "Manage departments.", icon: "Departments" },
    "admin/settings": { title: "Settings", description: "Admin settings.", icon: "Settings" },

    // Advisor pages
    "advisor/events": { title: "Events", description: "View events.", icon: "Events" },
    "advisor/submissions": { title: "Submissions", description: "Review student submissions.", icon: "Submissions" },
    "advisor/approvals": { title: "Approvals", description: "Approve submissions.", icon: "Approvals" },
    "advisor/reports": { title: "Reports", description: "Advisory reports.", icon: "Reports" },
    "advisor/students": { title: "Students", description: "View your students.", icon: "Students" },
    "advisor/class": { title: "Class", description: "Manage your class.", icon: "Departments" },
    "advisor/settings": { title: "Settings", description: "Advisor settings.", icon: "Settings" },

    // Coordinator pages
    "coordinator/events": { title: "Events", description: "Coordinate events.", icon: "Events" },
    "coordinator/submissions": { title: "Submissions", description: "View department submissions.", icon: "Submissions" },
    "coordinator/approvals": { title: "Approvals", description: "Final approvals.", icon: "Approvals" },
    "coordinator/reports": { title: "Reports", description: "Department reports.", icon: "Reports" },
    "coordinator/students": { title: "Students", description: "View students.", icon: "Students" },
    "coordinator/department": { title: "Department", description: "Department overview.", icon: "Departments" },
    "coordinator/settings": { title: "Settings", description: "Coordinator settings.", icon: "Settings" },

    // HOD pages
    "hod/events": { title: "Events", description: "Department events.", icon: "Events" },
    "hod/submissions": { title: "Submissions", description: "View submissions.", icon: "Submissions" },
    "hod/approvals": { title: "Approvals", description: "Department approvals.", icon: "Approvals" },
    "hod/reports": { title: "Reports", description: "Department reports.", icon: "Reports" },
    "hod/students": { title: "Students", description: "Department students.", icon: "Students" },
    "hod/department": { title: "Department", description: "Department overview.", icon: "Departments" },
    "hod/settings": { title: "Settings", description: "HOD settings.", icon: "Settings" },
    "hod/faculty": { title: "Faculty", description: "Department faculty.", icon: "Faculty" },

    // Mentor pages
    "mentor/events": { title: "Events", description: "View events.", icon: "Events" },
    "mentor/submissions": { title: "Submissions", description: "Mentee submissions.", icon: "Submissions" },
    "mentor/approvals": { title: "Approvals", description: "Approve submissions.", icon: "Approvals" },
    "mentor/reports": { title: "Reports", description: "Mentee reports.", icon: "Reports" },
    "mentor/students": { title: "Students", description: "Your mentees.", icon: "Students" },
    "mentor/department": { title: "Department", description: "Department info.", icon: "Departments" },
    "mentor/settings": { title: "Settings", description: "Mentor settings.", icon: "Settings" },

    // Principal pages
    "principal/events": { title: "Events", description: "Institution events.", icon: "Events" },
    "principal/submissions": { title: "Submissions", description: "All submissions.", icon: "Submissions" },
    "principal/approvals": { title: "Approvals", description: "Institution approvals.", icon: "Approvals" },
    "principal/reports": { title: "Reports", description: "Institution reports.", icon: "Reports" },
    "principal/students": { title: "Students", description: "All students.", icon: "Students" },
    "principal/faculty": { title: "Faculty", description: "All faculty.", icon: "Faculty" },
    "principal/departments": { title: "Departments", description: "All departments.", icon: "Departments" },
    "principal/settings": { title: "Settings", description: "Principal settings.", icon: "Settings" },

    // Student pages
    "student/events": { title: "Events", description: "Browse events.", icon: "Events" },
    "student/submissions": { title: "Submissions", description: "Your submissions.", icon: "Submissions" },
    "student/approvals": { title: "Approvals", description: "Approval status.", icon: "Approvals" },
    "student/reports": { title: "Reports", description: "Your reports.", icon: "Reports" },
    "student/settings": { title: "Settings", description: "Your settings.", icon: "Settings" },
};

// Valid roles for validation
export const validRoles = ["sudo", "admin", "student", "mentor", "advisor", "coordinator", "hod", "principal"];

// Get page config by role and slug
export function getPageConfig(role, slug) {
    const key = `${role}/${slug}`;
    return pageConfig[key] || null;
}

// Get all static params for generateStaticParams
export function getAllStaticParams() {
    return Object.keys(pageConfig).map((key) => {
        const [role, ...slugParts] = key.split("/");
        return { role, slug: slugParts };
    });
}

export default pageConfig;
