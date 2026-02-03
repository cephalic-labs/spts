import { databases } from "../appwrite";
import { DB_CONFIG } from "../dbConfig";
import { ID, Query } from "appwrite";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

/**
 * Get all faculties with optional filters
 */
export async function getFaculties(filters = {}, limit = 100, offset = 0) {
    try {
        const queries = [
            Query.orderAsc("name"),
            Query.limit(limit),
            Query.offset(offset),
        ];

        if (filters.department) {
            queries.push(Query.equal("department", filters.department));
        }
        if (filters.role) {
            queries.push(Query.equal("role", filters.role));
        }

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.FACULTIES,
            queries
        );
        return response;
    } catch (error) {
        console.error("Error getting faculties:", error);
        throw error;
    }
}

/**
 * Get faculty by ID
 */
export async function getFacultyById(facultyId) {
    try {
        const faculty = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.FACULTIES,
            facultyId
        );
        return faculty;
    } catch (error) {
        console.error("Error getting faculty:", error);
        throw error;
    }
}

/**
 * Get faculty by Appwrite user ID
 */
export async function getFacultyByAppwriteId(appwriteUserId) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.FACULTIES,
            [Query.equal("appwrite_user_id", appwriteUserId)]
        );
        return response.documents.length > 0 ? response.documents[0] : null;
    } catch (error) {
        console.error("Error getting faculty by Appwrite ID:", error);
        throw error;
    }
}

/**
 * Create new faculty
 */
export async function createFaculty(data) {
    const payload = {
        faculty_id: ID.unique(),
        appwrite_user_id: data.appwrite_user_id || null,
        name: data.name,
        email: data.email,
        department: data.department,
        designation: data.designation,
        role: data.role,
        assigned_sections: data.assigned_sections || [],
        assigned_years: data.assigned_years || [],
    };

    try {
        return await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.FACULTIES,
            ID.unique(),
            payload
        );
    } catch (error) {
        if (error.message?.includes("Unknown attribute")) {
            const missingAttr = error.message.match(/"([^"]+)"/)?.[1];
            if (missingAttr && payload[missingAttr] !== undefined) {
                console.warn(`Retrying faculty create without missing attribute: ${missingAttr}`);
                const { [missingAttr]: _, ...retryPayload } = payload;
                return await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.FACULTIES,
                    ID.unique(),
                    retryPayload
                );
            }
        }
        console.error("Error creating faculty:", error);
        throw error;
    }
}

/**
 * Update faculty
 */
export async function updateFaculty(facultyId, data) {
    try {
        return await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.FACULTIES,
            facultyId,
            data
        );
    } catch (error) {
        if (error.message?.includes("Unknown attribute")) {
            const missingAttr = error.message.match(/"([^"]+)"/)?.[1];
            if (missingAttr && data[missingAttr] !== undefined) {
                console.warn(`Retrying faculty update without missing attribute: ${missingAttr}`);
                const { [missingAttr]: _, ...retryData } = data;
                return await updateFaculty(facultyId, retryData);
            }
        }
        console.error("Error updating faculty:", error);
        throw error;
    }
}

/**
 * Delete faculty
 */
export async function deleteFaculty(facultyId) {
    try {
        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.FACULTIES,
            facultyId
        );
    } catch (error) {
        console.error("Error deleting faculty:", error);
        throw error;
    }
}

export default {
    getFaculties,
    getFacultyById,
    getFacultyByAppwriteId,
    createFaculty,
    updateFaculty,
    deleteFaculty,
};
