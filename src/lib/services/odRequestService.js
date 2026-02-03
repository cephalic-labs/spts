import { databases } from "../appwrite";
import { DB_CONFIG, OD_STATUS, getNextStatus } from "../dbConfig";
import { ID, Query } from "appwrite";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

/**
 * Create new OD request
 */
export async function createODRequest(data) {
    const payload = {
        od_id: data.od_id || ID.unique(),
        student_id: data.student_id,
        event_id: data.event_id,
        od_start_date: data.od_start_date,
        od_end_date: data.od_end_date,
        reason: data.reason,
        attachments: data.attachments || [],
        current_status: data.current_status || OD_STATUS.PENDING_MENTOR,
    };

    // Only add optional fields if they are present in data and not undefined
    const optionalFields = ['mentor_id', 'advisor_id', 'coordinator_id', 'hod_id'];
    optionalFields.forEach(field => {
        if (data[field] !== undefined) {
            payload[field] = data[field];
        }
    });

    try {
        return await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.OD_REQUESTS,
            ID.unique(),
            payload
        );
    } catch (error) {
        if (error.message?.includes("Unknown attribute")) {
            const missingAttr = error.message.match(/"([^"]+)"/)?.[1];
            if (missingAttr) {
                console.warn(`Retrying OD request creation without missing attribute: ${missingAttr}`);
                const nextData = { ...data };
                delete nextData[missingAttr];
                return await createODRequest(nextData);
            }
        }
        console.error("Error creating OD request:", error);
        throw error;
    }
}

/**
 * Get OD requests by status for approval
 */
export async function getODRequestsByStatus(status, limit = 50) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.OD_REQUESTS,
            [
                Query.equal("current_status", status),
                Query.orderDesc("$createdAt"),
                Query.limit(limit),
            ]
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
export async function approveODRequest(odId, role, userId, remarks = "") {
    try {
        const odRequest = await getODRequestById(odId);
        const fromStatus = odRequest.current_status;
        const toStatus = getNextStatus(fromStatus);
        const now = new Date().toISOString();

        // Update OD request
        const updateData = {
            current_status: toStatus,
        };

        // Set role-specific fields
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
            updateData.final_decision = "approved";
        }

        try {
            const updatedOD = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.OD_REQUESTS,
                odId,
                updateData
            );

            // Log the approval
            await logApproval(odId, fromStatus, toStatus, "approve", userId, role, remarks);

            return updatedOD;
        } catch (updateError) {
            if (updateError.message?.includes("Unknown attribute")) {
                const missingAttr = updateError.message.match(/"([^"]+)"/)?.[1];
                if (missingAttr && updateData[missingAttr] !== undefined) {
                    console.warn(`Retrying OD approval without missing attribute: ${missingAttr}`);
                    const { [missingAttr]: _, ...retryData } = updateData;
                    // Attempt the update again without the problematic attribute
                    return await databases.updateDocument(
                        DATABASE_ID,
                        COLLECTIONS.OD_REQUESTS,
                        odId,
                        retryData
                    );
                }
            }
            throw updateError;
        }
    } catch (error) {
        console.error("Error approving OD request:", error);
        throw error;
    }
}

/**
 * Reject OD request
 */
export async function rejectODRequest(odId, role, userId, remarks = "") {
    try {
        const odRequest = await getODRequestById(odId);
        const fromStatus = odRequest.current_status;
        const now = new Date().toISOString();

        const updateData = {
            current_status: OD_STATUS.REJECTED,
            final_decision: "rejected",
        };

        // Set role-specific rejection fields
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

        try {
            const updatedOD = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.OD_REQUESTS,
                odId,
                updateData
            );

            // Log the rejection
            await logApproval(odId, fromStatus, OD_STATUS.REJECTED, "reject", userId, role, remarks);

            return updatedOD;
        } catch (updateError) {
            if (updateError.message?.includes("Unknown attribute")) {
                const missingAttr = updateError.message.match(/"([^"]+)"/)?.[1];
                if (missingAttr && updateData[missingAttr] !== undefined) {
                    console.warn(`Retrying OD rejection without missing attribute: ${missingAttr}`);
                    const { [missingAttr]: _, ...retryData } = updateData;
                    return await databases.updateDocument(
                        DATABASE_ID,
                        COLLECTIONS.OD_REQUESTS,
                        odId,
                        retryData
                    );
                }
            }
            throw updateError;
        }
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
        const queries = [];
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
            pending: response.documents.filter(d => d.current_status.startsWith('pending')).length,
            approved: response.documents.filter(d => d.current_status === OD_STATUS.APPROVED).length,
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
