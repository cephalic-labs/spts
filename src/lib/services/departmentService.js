import { databases } from "../appwrite";
import { DB_CONFIG } from "../dbConfig";
import { ID, Query } from "appwrite";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

/**
 * Get all departments
 */
export async function getDepartments(limit = 50, offset = 0) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.DEPARTMENTS,
            [
                Query.orderAsc("name"),
                Query.limit(limit),
                Query.offset(offset),
            ]
        );
        return response;
    } catch (error) {
        console.error("Error getting departments:", error);
        throw error;
    }
}

/**
 * Create new department
 */
export async function createDepartment(data) {
    try {
        const department = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.DEPARTMENTS,
            ID.unique(),
            {
                name: data.name,
                hod_name: data.hod_name || "",
                hod_id: data.hod_id || null, // Link to faculty document if needed
            }
        );
        return department;
    } catch (error) {
        console.error("Error creating department:", error);
        throw error;
    }
}

/**
 * Update department
 */
export async function updateDepartment(documentId, data) {
    try {
        const department = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.DEPARTMENTS,
            documentId,
            data
        );
        return department;
    } catch (error) {
        console.error("Error updating department:", error);
        throw error;
    }
}

/**
 * Delete department
 */
export async function deleteDepartment(documentId) {
    try {
        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.DEPARTMENTS,
            documentId
        );
    } catch (error) {
        console.error("Error deleting department:", error);
        throw error;
    }
}

export default {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
};
