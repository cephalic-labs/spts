// Centralized page configuration for all dashboard pages
// Used by dynamic routes to render appropriate content

import { VALID_ROLES } from "./dbConfig";

export const pageConfig = {
    // Sudo pages
    "sudo/events": { title: "Events", description: "Manage all system events.", icon: "Events" },
    "sudo/submissions": { title: "Submissions", description: "View all participation submissions.", icon: "Submissions" },
    "sudo/approvals": { title: "Approvals", description: "Review and approve pending submissions.", icon: "Approvals" },
    "sudo/students": { title: "Students", description: "Manage student records.", icon: "Students" },
    "sudo/faculty": { title: "Faculty", description: "Manage faculty accounts.", icon: "Faculty" },
    "sudo/import": { title: "Excel Import", description: "Bulk import data from Excel.", icon: "Import" },
    "sudo/settings": { title: "Settings", description: "System-wide settings.", icon: "Settings" },
    "sudo/admins": { title: "Admins", description: "Manage admin accounts.", icon: "Faculty" },

    // Admin pages
    "admin/events": { title: "Events", description: "Manage events.", icon: "Events" },
    "admin/submissions": { title: "Submissions", description: "View submissions.", icon: "Submissions" },
    "admin/approvals": { title: "Approvals", description: "Review approvals.", icon: "Approvals" },
    "admin/students": { title: "Students", description: "Manage students.", icon: "Students" },
    "admin/faculty": { title: "Faculty", description: "Manage faculty.", icon: "Faculty" },
    "admin/settings": { title: "Settings", description: "Admin settings.", icon: "Settings" },

    // Advisor pages
    "advisor/events": { title: "Events", description: "View events.", icon: "Events" },
    "advisor/submissions": { title: "Submissions", description: "Review student submissions.", icon: "Submissions" },
    "advisor/approvals": { title: "Approvals", description: "Approve submissions.", icon: "Approvals" },
    "advisor/students": { title: "Students", description: "View your students.", icon: "Students" },
    "advisor/import": { title: "Excel Import", description: "Bulk import students from Excel.", icon: "Import" },
    "advisor/settings": { title: "Settings", description: "Advisor settings.", icon: "Settings" },

    // Coordinator pages
    "coordinator/events": { title: "Events", description: "Coordinate events.", icon: "Events" },
    "coordinator/submissions": { title: "Submissions", description: "View department submissions.", icon: "Submissions" },
    "coordinator/approvals": { title: "Approvals", description: "Final approvals.", icon: "Approvals" },
    "coordinator/students": { title: "Students", description: "View students.", icon: "Students" },
    "coordinator/faculty": { title: "Faculty", description: "Manage faculty.", icon: "Faculty" },
    "coordinator/import": { title: "Excel Import", description: "Bulk import events from Excel.", icon: "Import" },
    "coordinator/settings": { title: "Settings", description: "Coordinator settings.", icon: "Settings" },

    // HOD pages
    "hod/events": { title: "Events", description: "Department events.", icon: "Events" },
    "hod/submissions": { title: "Submissions", description: "View submissions.", icon: "Submissions" },
    "hod/approvals": { title: "Approvals", description: "Department approvals.", icon: "Approvals" },
    "hod/students": { title: "Students", description: "Department students.", icon: "Students" },
    "hod/import": { title: "Excel Import", description: "Bulk import data from Excel.", icon: "Import" },
    "hod/settings": { title: "Settings", description: "HOD settings.", icon: "Settings" },
    "hod/faculty": { title: "Faculty", description: "Department faculty.", icon: "Faculty" },

    // Mentor pages
    "mentor/events": { title: "Events", description: "View events.", icon: "Events" },
    "mentor/submissions": { title: "Submissions", description: "Mentee submissions.", icon: "Submissions" },
    "mentor/approvals": { title: "Approvals", description: "Approve submissions.", icon: "Approvals" },
    "mentor/students": { title: "Students", description: "Your mentees.", icon: "Students" },
    "mentor/settings": { title: "Settings", description: "Mentor settings.", icon: "Settings" },

    // Principal pages
    "principal/events": { title: "Events", description: "Institution events.", icon: "Events" },
    "principal/submissions": { title: "Submissions", description: "All submissions.", icon: "Submissions" },
    "principal/approvals": { title: "Approvals", description: "Institution approvals.", icon: "Approvals" },
    "principal/students": { title: "Students", description: "All students.", icon: "Students" },
    "principal/faculty": { title: "Faculty", description: "All faculty.", icon: "Faculty" },
    "principal/settings": { title: "Settings", description: "Principal settings.", icon: "Settings" },

    // Student pages
    "student/events": { title: "Events", description: "Browse events.", icon: "Events" },
    "student/submissions": { title: "Submissions", description: "Your submissions.", icon: "Submissions" },
    "student/settings": { title: "Settings", description: "Your settings.", icon: "Settings" },
};

// Valid roles for validation
export const validRoles = VALID_ROLES;

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
