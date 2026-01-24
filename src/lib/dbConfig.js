// Database configuration for Appwrite
// All collection IDs are centralized here for easy management

export const DB_CONFIG = {
    DATABASE_ID: "sece-spts-db",

    COLLECTIONS: {
        USERS: "users",
        STUDENTS: "sece-students",
        FACULTIES: "sece-faculties",
        EVENTS: "events",
        OD_REQUESTS: "od-requests",
        APPROVAL_LOGS: "approval_logs",
    },
};

// Approval workflow statuses
export const OD_STATUS = {
    PENDING_MENTOR: "pending_mentor",
    PENDING_ADVISOR: "pending_advisor",
    PENDING_COORDINATOR: "pending_coordinator",
    PENDING_HOD: "pending_hod",
    APPROVED: "approved",
    REJECTED: "rejected",
};

// Role hierarchy for approval workflow
export const APPROVAL_ROLES = ["mentor", "advisor", "coordinator", "hod"];

// Get next status after approval
export function getNextStatus(currentStatus) {
    const statusFlow = {
        [OD_STATUS.PENDING_MENTOR]: OD_STATUS.PENDING_ADVISOR,
        [OD_STATUS.PENDING_ADVISOR]: OD_STATUS.PENDING_COORDINATOR,
        [OD_STATUS.PENDING_COORDINATOR]: OD_STATUS.PENDING_HOD,
        [OD_STATUS.PENDING_HOD]: OD_STATUS.APPROVED,
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
