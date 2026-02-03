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
        faculty_id: String(data.faculty_id || ID.unique()).substring(0, 36),
        appwrite_user_id: data.appwrite_user_id || null,
        name: String(data.name || "").substring(0, 100),
        email: String(data.email || "").substring(0, 100),
        department: String(data.department || "").substring(0, 4),
        designation: String(data.designation || "").substring(0, 50),
        role: String(data.role || "mentor").substring(0, 30),
        assigned_sections: Array.isArray(data.assigned_sections) ? data.assigned_sections.map(s => String(s).substring(0, 10)) : [],
        assigned_years: Array.isArray(data.assigned_years) ? data.assigned_years.map(y => parseInt(y)).filter(y => !isNaN(y)) : [],
    };

    try {
        return await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.FACULTIES,
            ID.unique(),
            payload
        );
    } catch (error) {
        console.error("Error creating faculty:", error);
        throw error;
    }
}

/**
 * Update faculty
 */
export async function updateFaculty(facultyId, data) {
    try {
        const updateData = { ...data };
        if (updateData.assigned_years) {
            updateData.assigned_years = updateData.assigned_years.map(y => parseInt(y)).filter(y => !isNaN(y));
        }

        return await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.FACULTIES,
            facultyId,
            updateData
        );
    } catch (error) {
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
