// Database configuration for Appwrite
// All collection IDs are centralized here for easy management

export const DB_CONFIG = {
    DATABASE_ID: "sece-spts-db",

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

// Approval workflow statuses
export const OD_STATUS = {
    // Legacy status kept for backward compatibility
    PENDING_MENTOR: "pending_mentor",
    PENDING_ADVISOR: "pending_advisor",
    PENDING_COORDINATOR: "pending_coordinator",
    PENDING_HOD: "pending_hod",
    GRANTED: "granted",
    // Legacy final status kept for backward compatibility
    APPROVED: "approved",
    REJECTED: "rejected",
};

// Role hierarchy for approval workflow
export const APPROVAL_ROLES = ["mentor", "advisor", "coordinator", "hod"];

// Get next status after approval
export function getNextStatus(currentStatus) {
    const statusFlow = {
        // Legacy requests can still move from mentor to advisor
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
