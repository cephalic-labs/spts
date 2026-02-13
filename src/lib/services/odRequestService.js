import { databases } from "../appwrite";
import { DB_CONFIG, OD_STATUS, canRoleApprove, getNextStatus } from "../dbConfig";
import { ID, Query } from "appwrite";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

function normalizeDateOnly(value) {
    if (!value) return "";

    if (typeof value === "string") {
        const matchedDate = value.match(/^(\d{4}-\d{2}-\d{2})/);
        if (matchedDate) return matchedDate[1];
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return "";

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

async function getStudentRecordForOD(studentAppwriteId, studentEmail) {
    if (!studentAppwriteId && !studentEmail) return null;

    if (studentAppwriteId) {
        try {
            const byAppwriteId = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.STUDENTS,
                [Query.equal("appwrite_user_id", studentAppwriteId), Query.limit(1)]
            );
            if (byAppwriteId.documents.length > 0) {
                return byAppwriteId.documents[0];
            }
        } catch (error) {
            const isMissingAttr = String(error?.message || "").includes("Attribute not found in schema");
            if (!isMissingAttr) {
                throw error;
            }
        }
    }

    if (studentEmail) {
        try {
            const byEmail = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.STUDENTS,
                [Query.equal("email", studentEmail.trim().toLowerCase()), Query.limit(1)]
            );
            if (byEmail.documents.length > 0) {
                return byEmail.documents[0];
            }

            // Fallback: try original email casing
            const byEmailOriginal = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.STUDENTS,
                [Query.equal("email", studentEmail), Query.limit(1)]
            );
            if (byEmailOriginal.documents.length > 0) {
                return byEmailOriginal.documents[0];
            }
        } catch (error) {
            console.error("Error finding student by email:", error);
        }
    }

    return null;
}

async function getEventParticipation(eventId, studentId) {
    const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.EVENT_PARTICIPATIONS,
        [
            Query.equal("event_id", eventId),
            Query.equal("student_id", studentId),
            Query.limit(1),
        ]
    );

    return response.documents?.[0] || null;
}

async function getDepartmentApprover(department, role) {
    if (!department || !role) return null;

    const normalizedDept = department.trim();
    const rolesToTry = [role.toLowerCase()];

    // Add common casing variants
    if (role.toLowerCase() === "hod") {
        rolesToTry.push("HOD", "Hod", "head of department");
    } else if (role.toLowerCase() === "coordinator") {
        rolesToTry.push("Coordinator", "COORDINATOR");
    }

    for (const tryRole of rolesToTry) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.FACULTIES,
                [
                    Query.equal("department", normalizedDept),
                    Query.equal("role", tryRole),
                    Query.limit(1),
                ]
            );
            if (response.documents.length > 0) return response.documents[0];
        } catch (error) {
            // Try next variant
        }
    }

    return null;
}

async function getFacultyByFacultyId(facultyId) {
    if (!facultyId) return null;

    try {
        // First try to get by Document ID (standard Appwrite relationship)
        const faculty = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.FACULTIES,
            facultyId
        );
        return faculty;
    } catch (error) {
        // If not found by ID, try searching by faculty_id attribute (Employee ID)
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.FACULTIES,
                [
                    Query.equal("faculty_id", facultyId),
                    Query.limit(1),
                ]
            );
            return response.documents?.[0] || null;
        } catch (searchError) {
            console.error("Error searching faculty:", searchError);
            return null;
        }
    }
}

/**
 * Create new OD request
 */
export async function createODRequest(data) {
    try {
        if (!data?.student_id || !data?.event_id) {
            throw new Error("Student and event are required for OD submission");
        }

        // Validate event
        let event;
        try {
            event = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.EVENTS,
                data.event_id
            );
        } catch (err) {
            throw new Error("Selected event not found. It may have been deleted.");
        }

        const eventDate = normalizeDateOnly(event?.event_time);
        const odStartDate = normalizeDateOnly(data.od_start_date);
        const odEndDate = normalizeDateOnly(data.od_end_date);

        if (!odStartDate || !odEndDate) {
            throw new Error("Please provide valid OD start and end dates.");
        }
        if (odStartDate > odEndDate) {
            throw new Error("OD start date cannot be after end date.");
        }
        if (!eventDate) {
            throw new Error("The selected event has no valid date configured.");
        }
        if (odStartDate > eventDate || odEndDate > eventDate) {
            throw new Error("OD dates must be on or before the event date.");
        }

        // Validate participation
        const participation = await getEventParticipation(data.event_id, data.student_id);
        if (!participation || participation.status !== "participated") {
            throw new Error("You can only request OD for events you have marked as 'Participated'. Go to Events page to update your participation status.");
        }

        // Get student record
        const studentRecord = await getStudentRecordForOD(data.student_id, data.student_email || null);
        if (!studentRecord) {
            throw new Error("Your student profile was not found. Please contact your coordinator to add you to the system.");
        }

        // Validate mentor
        if (!data.mentor_id && !studentRecord.mentor_id) {
            throw new Error("No mentor is assigned to your profile. Please select a mentor or contact your coordinator.");
        }

        // Validate advisor
        const advisorId = studentRecord.advisor_id || null;
        let advisor = null;
        if (advisorId) {
            advisor = await getFacultyByFacultyId(advisorId);
        }
        if (!advisor) {
            throw new Error("Your class advisor is not assigned or not found in the system. Please contact your coordinator to update your profile.");
        }

        // Validate coordinator (optional - proceed without if not found)
        const coordinator = await getDepartmentApprover(studentRecord.department, "coordinator");
        if (!coordinator) {
            throw new Error(`No coordinator is configured for the "${studentRecord.department}" department. Please contact your HOD or admin.`);
        }

        // Validate HOD (optional - proceed without if not found)
        const hod = await getDepartmentApprover(studentRecord.department, "hod");
        if (!hod) {
            throw new Error(`No HOD is configured for the "${studentRecord.department}" department. Please contact your admin.`);
        }

        const odRequest = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.OD_REQUESTS,
            ID.unique(),
            {
                od_id: ID.unique(),
                student_id: data.student_id,
                event_id: data.event_id,
                od_start_date: odStartDate,
                od_end_date: odEndDate,
                reason: data.reason,
                attachments: data.attachments || [],
                current_status: OD_STATUS.PENDING_MENTOR,
                mentor_id: data.mentor_id || studentRecord.mentor_id,
                advisor_id: advisor ? advisor.$id : (advisorId || null),
                coordinator_id: coordinator ? coordinator.$id : null,
                hod_id: hod ? hod.$id : null,
                final_decision: null,
            }
        );
        return odRequest;
    } catch (error) {
        console.error("Error creating OD request:", error);
        throw error;
    }
}

/**
 * Get OD requests by status for approval
 */
export async function getODRequestsByStatus(status, limit = 50, filters = {}) {
    try {
        const queries = [
            Query.equal("current_status", status),
            Query.orderDesc("$createdAt"),
            Query.limit(limit),
        ];

        if (filters.approverRole) {
            if (filters.approverIds && Array.isArray(filters.approverIds) && filters.approverIds.length > 0) {
                // Check if role_id matches ANY of the provided IDs
                queries.push(Query.equal(`${filters.approverRole}_id`, filters.approverIds));
            } else if (filters.approverId) {
                queries.push(Query.equal(`${filters.approverRole}_id`, filters.approverId));
            }
        }

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.OD_REQUESTS,
            queries
        );
        return response;
    } catch (error) {
        console.error("Error getting OD requests by status:", error);
        throw error;
    }
}

/**
 * Get OD requests for a specific student
 */
export async function getStudentODRequests(studentId, limit = 50) {
    if (!studentId) {
        return { documents: [], total: 0 };
    }

    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.OD_REQUESTS,
            [
                Query.equal("student_id", studentId),
                Query.orderDesc("$createdAt"),
                Query.limit(limit),
            ]
        );
        return response;
    } catch (error) {
        console.error("Error getting student OD requests:", error);
        throw error;
    }
}

/**
 * Get OD request by ID
 */
export async function getODRequestById(odId) {
    try {
        const response = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.OD_REQUESTS,
            odId
        );
        return response;
    } catch (error) {
        console.error("Error getting OD request:", error);
        throw error;
    }
}

/**
 * Approve OD request - moves to next status
 */
export async function approveODRequest(odId, role, userId, remarks = "", approverId = null) {
    try {
        const odRequest = await getODRequestById(odId);
        const fromStatus = odRequest.current_status;

        if (!canRoleApprove(role, fromStatus)) {
            throw new Error(`Your role (${role}) cannot approve requests in '${fromStatus}' status.`);
        }

        if (approverId && odRequest[`${role}_id`]) {
            const allowedIds = Array.isArray(approverId) ? approverId : [approverId];
            if (!allowedIds.includes(odRequest[`${role}_id`])) {
                throw new Error("You are not assigned as the approver for this request.");
            }
        }

        const toStatus = getNextStatus(fromStatus);
        if (!toStatus) {
            throw new Error(`No next approval step configured for '${fromStatus}'. Contact admin.`);
        }
        const now = new Date().toISOString();

        // Update OD request
        const updateData = {
            current_status: toStatus,
        };

        // Set role-specific fields
        // Set role-specific fields (Commenting out to avoid schema validation errors if fields don't exist)
        /*
        if (role === "mentor") {
            updateData.mentor_status = "approved";
            updateData.mentor_remarks = remarks;
            updateData.mentor_action_at = now;
        } else if (role === "advisor") {
            updateData.advisor_status = "approved";
            updateData.advisor_remarks = remarks;
            updateData.advisor_action_at = now;
        } else if (role === "coordinator") {
            updateData.coordinator_status = "approved";
            updateData.coordinator_remarks = remarks;
            updateData.coordinator_action_at = now;
        } else if (role === "hod") {
            updateData.hod_status = "approved";
            updateData.hod_remarks = remarks;
            updateData.hod_action_at = now;
            updateData.final_decision = "granted";
        }
        */

        if (role === "hod") {
            updateData.final_decision = "granted";
        }

        const updatedOD = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.OD_REQUESTS,
            odId,
            updateData
        );

        // Log the approval
        await logApproval(odId, fromStatus, toStatus, "approve", userId, role, remarks);

        return updatedOD;
    } catch (error) {
        console.error("Error approving OD request:", error);
        throw error;
    }
}

/**
 * Reject OD request
 */
export async function rejectODRequest(odId, role, userId, remarks = "", approverId = null) {
    try {
        const odRequest = await getODRequestById(odId);
        const fromStatus = odRequest.current_status;

        if (!canRoleApprove(role, fromStatus)) {
            throw new Error(`Your role (${role}) cannot reject requests in '${fromStatus}' status.`);
        }

        if (approverId && odRequest[`${role}_id`]) {
            const allowedIds = Array.isArray(approverId) ? approverId : [approverId];
            if (!allowedIds.includes(odRequest[`${role}_id`])) {
                throw new Error("You are not assigned as the approver for this request.");
            }
        }

        const now = new Date().toISOString();

        const updateData = {
            current_status: OD_STATUS.REJECTED,
            final_decision: "rejected",
        };

        // Set role-specific rejection fields
        // Set role-specific rejection fields (Commenting out to avoid schema validation errors)
        /*
        if (role === "mentor") {
            updateData.mentor_status = "rejected";
            updateData.mentor_remarks = remarks;
            updateData.mentor_action_at = now;
        } else if (role === "advisor") {
            updateData.advisor_status = "rejected";
            updateData.advisor_remarks = remarks;
            updateData.advisor_action_at = now;
        } else if (role === "coordinator") {
            updateData.coordinator_status = "rejected";
            updateData.coordinator_remarks = remarks;
            updateData.coordinator_action_at = now;
        } else if (role === "hod") {
            updateData.hod_status = "rejected";
            updateData.hod_remarks = remarks;
            updateData.hod_action_at = now;
        }
        */

        const updatedOD = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.OD_REQUESTS,
            odId,
            updateData
        );

        // Log the rejection
        await logApproval(odId, fromStatus, OD_STATUS.REJECTED, "reject", userId, role, remarks);

        return updatedOD;
    } catch (error) {
        console.error("Error rejecting OD request:", error);
        throw error;
    }
}

/**
 * Log approval action
 */
async function logApproval(odId, fromStatus, toStatus, action, userId, role, remarks) {
    try {
        await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.APPROVAL_LOGS,
            ID.unique(),
            {
                log_id: ID.unique(),
                od_id: odId,
                from_status: fromStatus,
                to_status: toStatus,
                action: action,
                action_by_user_id: userId,
                action_by_role: role,
                remarks: remarks || null,
                action_at: new Date().toISOString(),
            }
        );
    } catch (error) {
        console.error("Error logging approval:", error);
    }
}

/**
 * Get approval logs for a specific OD request
 */
export async function getApprovalLogsByODId(odId) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.APPROVAL_LOGS,
            [
                Query.equal("od_id", odId),
                Query.orderAsc("action_at"),
            ]
        );
        return response;
    } catch (error) {
        console.error("Error getting approval logs:", error);
        throw error;
    }
}

/**
 * Get recent approval logs
 */
export async function getRecentApprovalLogs(limit = 20) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.APPROVAL_LOGS,
            [
                Query.orderDesc("action_at"),
                Query.limit(limit),
            ]
        );
        return response;
    } catch (error) {
        console.error("Error getting recent approval logs:", error);
        throw error;
    }
}

/**
 * Get all OD requests (for admin/sudo)
 */
export async function getAllODRequests(limit = 100) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.OD_REQUESTS,
            [
                Query.orderDesc("$createdAt"),
                Query.limit(limit),
            ]
        );
        return response;
    } catch (error) {
        console.error("Error getting all OD requests:", error);
        throw error;
    }
}

/**
 * Get OD request stats (total, pending, approved, rejected)
 */
export async function getODStats(filter = {}) {
    try {
        const queries = [Query.limit(500)];
        if (filter.student_id) {
            queries.push(Query.equal("student_id", filter.student_id));
        }

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.OD_REQUESTS,
            queries
        );

        const stats = {
            total: response.total,
            pending: response.documents.filter(d => d.current_status?.startsWith('pending')).length,
            approved: response.documents.filter(
                (d) => d.current_status === OD_STATUS.GRANTED || d.current_status === OD_STATUS.APPROVED
            ).length,
            rejected: response.documents.filter(d => d.current_status === OD_STATUS.REJECTED).length,
        };

        return stats;
    } catch (error) {
        console.error("Error getting OD stats:", error);
        return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }
}

export default {
    createODRequest,
    getODRequestsByStatus,
    getStudentODRequests,
    getODRequestById,
    approveODRequest,
    rejectODRequest,
    getAllODRequests,
    getApprovalLogsByODId,
    getRecentApprovalLogs,
    getODStats,
};
