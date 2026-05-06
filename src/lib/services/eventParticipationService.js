import { ID, Query } from "appwrite";
import { databases } from "../appwrite";
import { DB_CONFIG } from "../dbConfig";
import { decrementParticipationCount, incrementParticipationCount } from "./eventService";
import { getStudentById, getStudentByAppwriteUserId } from "./studentService";
import { secureLog } from "../secureLogger";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

export const PARTICIPATION_STATUS = {
    PARTICIPATED: "participated",
    NOT_PARTICIPATED: "not_participated",
};

function getCountDelta(previousStatus, nextStatus) {
    if (previousStatus === nextStatus) return 0;
    if (previousStatus === PARTICIPATION_STATUS.PARTICIPATED && nextStatus !== PARTICIPATION_STATUS.PARTICIPATED) {
        return -1;
    }
    if (previousStatus !== PARTICIPATION_STATUS.PARTICIPATED && nextStatus === PARTICIPATION_STATUS.PARTICIPATED) {
        return 1;
    }
    return 0;
}

function validateStatus(status) {
    const validStatuses = Object.values(PARTICIPATION_STATUS);
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid participation status: ${status}`);
    }
}

async function getParticipationRecord(eventId, studentId) {
    let searchStudentIds = [studentId];
    try {
        let studentRecord = await getStudentById(studentId).catch(() => null);
        if (!studentRecord) {
            studentRecord = await getStudentByAppwriteUserId(studentId).catch(() => null);
        }
        if (studentRecord) {
            searchStudentIds.push(studentRecord.$id);
            if (studentRecord.appwrite_user_id) {
                searchStudentIds.push(studentRecord.appwrite_user_id);
            }
        }
    } catch (err) {}

    const uniqueIds = [...new Set(searchStudentIds)].filter(Boolean);

    for (const idToSearch of uniqueIds) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.EVENT_PARTICIPATIONS,
                [
                    Query.equal("event_id", eventId),
                    Query.equal("student_id", idToSearch),
                    Query.limit(1),
                ]
            );
            if (response.documents && response.documents.length > 0) {
                return response.documents[0];
            }
        } catch (err) {
            // continue
        }
    }

    return null;
}

/**
 * Get all participation records for a student
 */
export async function getStudentEventParticipations(studentId, limit = 100) {
    try {
        const idsToSearch = Array.isArray(studentId) ? studentId : [studentId];
        const uniqueIds = [...new Set(idsToSearch)].filter(Boolean);
        
        let allDocuments = [];
        
        for (const id of uniqueIds) {
            try {
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.EVENT_PARTICIPATIONS,
                    [
                        Query.equal("student_id", id),
                        Query.limit(limit),
                        Query.orderDesc("$updatedAt"),
                    ]
                );
                if (response.documents) {
                    allDocuments = [...allDocuments, ...response.documents];
                }
            } catch (err) {
                // Continue to next ID
            }
        }
        
        // Remove duplicates if any (based on event_id)
        const uniqueDocsMap = new Map();
        for (const doc of allDocuments) {
            if (!uniqueDocsMap.has(doc.event_id)) {
                uniqueDocsMap.set(doc.event_id, doc);
            }
        }
        
        const finalDocs = Array.from(uniqueDocsMap.values())
            .sort((a, b) => new Date(b.$updatedAt) - new Date(a.$updatedAt))
            .slice(0, limit);

        return { documents: finalDocs, total: finalDocs.length };
    } catch (error) {
        secureLog.error("Error getting student event participations:", error);
        throw error;
    }
}

/**
 * Upsert student participation status for an event.
 * Supports status changes in both directions (participated <-> not_participated).
 */
export async function setStudentParticipationStatus(eventId, studentId, status) {
    if (!eventId || !studentId) {
        throw new Error("Event ID and student ID are required");
    }

    validateStatus(status);

    try {
        const existing = await getParticipationRecord(eventId, studentId);
        const previousStatus = existing?.status || null;
        const countDelta = getCountDelta(previousStatus, status);

        let savedRecord;
        if (existing) {
            savedRecord = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.EVENT_PARTICIPATIONS,
                existing.$id,
                { status }
            );
        } else {
            savedRecord = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.EVENT_PARTICIPATIONS,
                ID.unique(),
                {
                    event_id: eventId,
                    student_id: studentId,
                    status,
                }
            );
        }

        if (countDelta === 1) {
            await incrementParticipationCount(eventId);
        } else if (countDelta === -1) {
            await decrementParticipationCount(eventId);
        }

        return {
            document: savedRecord,
            previousStatus,
            currentStatus: status,
            statusChanged: previousStatus !== status,
            countDelta,
        };
    } catch (error) {
        secureLog.error("Error setting student participation status:", error);
        throw error;
    }
}

export default {
    PARTICIPATION_STATUS,
    getStudentEventParticipations,
    setStudentParticipationStatus,
};
