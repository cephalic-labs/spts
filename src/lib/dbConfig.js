// Database configuration for Appwrite
// All collection IDs are centralized here for easy management

export const DB_CONFIG = {
    DATABASE_ID: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,

    COLLECTIONS: {
        USERS: "users",
        STUDENTS: "sece-students",
        FACULTIES: "sece-faculties",
        EVENTS: "events",
        EVENT_PARTICIPATIONS: "event-participations",
        OD_REQUESTS: "od-requests",
        APPROVAL_LOGS: "approval_logs",
        DEPARTMENTS: "sece-departments",
    },
};

export const DEPARTMENTS_LIST = ["CSE", "AIDS", "AIML", "EEE", "MECH", "CSBS", "CCE", "ECE", "IT", "CYS"];

// Approval workflow statuses
export const OD_STATUS = {
    PENDING_MENTOR: "pending_mentor",
    PENDING_ADVISOR: "pending_advisor",
    PENDING_COORDINATOR: "pending_coordinator",
    PENDING_HOD: "pending_hod",
    GRANTED: "granted",
    APPROVED: "approved",
    REJECTED: "rejected",
    CANCELLED: "cancelled",
};

// Role hierarchy for approval workflow
export const APPROVAL_ROLES = ["mentor", "advisor", "coordinator", "hod"];

// Valid roles for the entire system
export const VALID_ROLES = ["sudo", "admin", "student", "mentor", "advisor", "coordinator", "hod", "principal"];

// Get next status after approval
export function getNextStatus(currentStatus) {
    const statusFlow = {
        [OD_STATUS.PENDING_MENTOR]: OD_STATUS.PENDING_ADVISOR,
        [OD_STATUS.PENDING_ADVISOR]: OD_STATUS.PENDING_COORDINATOR,
        [OD_STATUS.PENDING_COORDINATOR]: OD_STATUS.PENDING_HOD,
        [OD_STATUS.PENDING_HOD]: OD_STATUS.GRANTED,
    };
    return statusFlow[currentStatus] || null;
}

// Check if role can approve given status
export function canRoleApprove(role, status) {
    const roleStatusMap = {
        mentor: OD_STATUS.PENDING_MENTOR,
        advisor: OD_STATUS.PENDING_ADVISOR,
        coordinator: OD_STATUS.PENDING_COORDINATOR,
        hod: OD_STATUS.PENDING_HOD,
    };
    return roleStatusMap[role] === status;
}

export default DB_CONFIG;
