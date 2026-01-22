// Centralized page configuration for all dashboard pages
// Used by dynamic routes to render appropriate content

export const pageConfig = {
    // Sudo pages
    "sudo/events": {
        title: "Events Management",
        description: "Create, edit, and manage all system events. Configure event types, schedules, and participation rules.",
        icon: "Events",
    },
    "sudo/submissions": {
        title: "All Submissions",
        description: "View and manage all student participation submissions across the system.",
        icon: "Submissions",
    },
    "sudo/approvals": {
        title: "Approval Queue",
        description: "Review and approve pending submissions. Override decisions and manage approval workflows.",
        icon: "Approvals",
    },
    "sudo/reports": {
        title: "Reports & Analytics",
        description: "Generate comprehensive reports, view analytics, and export data for institutional analysis.",
        icon: "Reports",
    },
    "sudo/students": {
        title: "Student Management",
        description: "Manage student records, view participation history, and track academic achievements.",
        icon: "Students",
    },
    "sudo/faculty": {
        title: "Faculty Management",
        description: "Manage faculty accounts, assign roles, and configure permissions across departments.",
        icon: "Faculty",
    },
    "sudo/departments": {
        title: "Department Management",
        description: "Configure departments, assign HODs, and manage organizational structure.",
        icon: "Departments",
    },
    "sudo/import": {
        title: "Excel Import",
        description: "Bulk import students, faculty, and event data from Excel spreadsheets.",
        icon: "Import",
    },
    "sudo/settings": {
        title: "System Settings",
        description: "Configure system-wide settings, manage integrations, and customize platform behavior.",
        icon: "Settings",
    },

    // Admin pages
    "admin/users": {
        title: "User Management",
        description: "Manage user accounts, assign roles, and configure access permissions.",
        icon: "Faculty",
    },
    "admin/events": {
        title: "Events Management",
        description: "Create and manage events, configure event types and participation rules.",
        icon: "Events",
    },
    "admin/approvals": {
        title: "Approval Queue",
        description: "Review and process pending approval requests from the system.",
        icon: "Approvals",
    },
    "admin/reports": {
        title: "Reports & Analytics",
        description: "View system reports, analytics, and generate exportable summaries.",
        icon: "Reports",
    },
    "admin/departments": {
        title: "Department Management",
        description: "View and manage department configurations and assignments.",
        icon: "Departments",
    },
    "admin/settings": {
        title: "Admin Settings",
        description: "Configure administrative settings and system preferences.",
        icon: "Settings",
    },

    // Student pages
    "student/events": {
        title: "My Events",
        description: "Browse available events and view your participation history.",
        icon: "MyEvents",
    },
    "student/submissions": {
        title: "My Submissions",
        description: "Submit participation proofs and track the status of your submissions.",
        icon: "Submissions",
    },
    "student/certificates": {
        title: "My Certificates",
        description: "View and download certificates for your approved participations.",
        icon: "Certificate",
    },
    "student/profile": {
        title: "My Profile",
        description: "View and update your profile information and preferences.",
        icon: "Profile",
    },

    // Mentor pages
    "mentor/mentees": {
        title: "My Mentees",
        description: "View and manage your assigned mentees and their participation records.",
        icon: "Mentees",
    },
    "mentor/submissions": {
        title: "Mentee Submissions",
        description: "Review and track submissions from your mentees.",
        icon: "Submissions",
    },
    "mentor/approvals": {
        title: "Pending Approvals",
        description: "Review and approve submissions from your mentees.",
        icon: "Approvals",
    },
    "mentor/reports": {
        title: "Mentee Reports",
        description: "View participation reports and analytics for your mentees.",
        icon: "Reports",
    },

    // Advisor pages
    "advisor/mentees": {
        title: "My Mentees",
        description: "View and manage students under your advisory with their participation status.",
        icon: "Mentees",
    },
    "advisor/submissions": {
        title: "Student Submissions",
        description: "Review submissions from students in your advisory.",
        icon: "Submissions",
    },
    "advisor/approvals": {
        title: "Pending Approvals",
        description: "Review and approve student participation submissions.",
        icon: "Approvals",
    },
    "advisor/reports": {
        title: "Advisory Reports",
        description: "View reports and analytics for students in your advisory.",
        icon: "Reports",
    },

    // Coordinator pages
    "coordinator/events": {
        title: "Event Management",
        description: "Manage and coordinate events within your department.",
        icon: "Events",
    },
    "coordinator/submissions": {
        title: "All Submissions",
        description: "View and manage department submissions.",
        icon: "Submissions",
    },
    "coordinator/review": {
        title: "Review Submissions",
        description: "Review and verify student participation submissions.",
        icon: "Review",
    },
    "coordinator/approvals": {
        title: "Final Approvals",
        description: "Provide final approval for verified submissions.",
        icon: "Approvals",
    },
    "coordinator/reports": {
        title: "Department Reports",
        description: "Generate and view reports for your department.",
        icon: "Reports",
    },

    // HOD pages
    "hod/department": {
        title: "Department Overview",
        description: "View department statistics and performance metrics.",
        icon: "Departments",
    },
    "hod/faculty": {
        title: "Faculty Management",
        description: "View and manage faculty members in your department.",
        icon: "Faculty",
    },
    "hod/students": {
        title: "Student Overview",
        description: "View student participation data across your department.",
        icon: "Students",
    },
    "hod/approvals": {
        title: "Department Approvals",
        description: "Review and approve department-level submissions.",
        icon: "Approvals",
    },
    "hod/reports": {
        title: "Department Reports",
        description: "Generate and view comprehensive department reports.",
        icon: "Reports",
    },

    // Principal pages
    "principal/overview": {
        title: "Institution Overview",
        description: "View comprehensive analytics across all departments.",
        icon: "Analytics",
    },
    "principal/approvals": {
        title: "Institution Approvals",
        description: "Review and approve institution-level requests.",
        icon: "Approvals",
    },
    "principal/reports": {
        title: "Institution Reports",
        description: "Access comprehensive reports across all departments.",
        icon: "Reports",
    },
    "principal/departments": {
        title: "All Departments",
        description: "View and compare performance across all departments.",
        icon: "Departments",
    },
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
        return {
            role,
            slug: slugParts,
        };
    });
}

export default pageConfig;
