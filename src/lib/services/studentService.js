import { databases } from "../appwrite";
import { DB_CONFIG } from "../dbConfig";
import { ID, Query } from "appwrite";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

/**
 * Get all students with optional filters
 */
export async function getStudents(filters = {}, limit = 100, offset = 0) {
    try {
        const queries = [
            Query.orderAsc("name"),
            Query.limit(limit),
            Query.offset(offset),
        ];

        if (filters.department) {
            queries.push(Query.equal("department", filters.department));
        }
        if (filters.year) {
            queries.push(Query.equal("year", parseInt(filters.year)));
        }
        if (filters.section) {
            queries.push(Query.equal("section", filters.section));
        }
        if (filters.advisor_id) {
            queries.push(Query.equal("advisor_id", filters.advisor_id));
        }
        if (filters.mentor_id) {
            queries.push(Query.equal("mentor_id", filters.mentor_id));
        }

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            queries
        );
        return response;
    } catch (error) {
        console.error("Error getting students:", error);
        throw error;
    }
}

/**
 * Get student by ID
 */
export async function getStudentById(studentId) {
    try {
        const student = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            studentId
        );
        return student;
    } catch (error) {
        console.error("Error getting student:", error);
        throw error;
    }
}

/**
 * Get student by register number
 */
export async function getStudentByRegNo(regNo) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            [Query.equal("student_register_no", regNo)]
        );
        return response.documents.length > 0 ? response.documents[0] : null;
    } catch (error) {
        console.error("Error getting student by reg no:", error);
        throw error;
    }
}

/**
 * Create new student
 */
export async function createStudent(data) {
    try {
        const student = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            ID.unique(),
            {
                student_register_no: data.student_register_no,
                appwrite_user_id: data.appwrite_user_id || null,
                roll_no: data.roll_no,
                name: data.name,
                email: data.email,
                department: data.department,
                year: parseInt(data.year),
                section: data.section,
                advisor_id: data.advisor_id || null,
                mentor_id: data.mentor_id || null,
                status: data.status || "active",
            }
        );
        return student;
    } catch (error) {
        console.error("Error creating student:", error);
        throw error;
    }
}

/**
 * Update student
 */
export async function updateStudent(studentId, data) {
    try {
        const updateData = { ...data };
        if (updateData.year) {
            updateData.year = parseInt(updateData.year);
        }

        const student = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            studentId,
            updateData
        );
        return student;
    } catch (error) {
        console.error("Error updating student:", error);
        throw error;
    }
}

/**
 * Get student stats
 */
export async function getStudentStats() {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            [Query.limit(1)]
        );
        return {
            total: response.total,
        };
    } catch (error) {
        console.error("Error getting student stats:", error);
        return { total: 0 };
    }
}

/**
 * Delete student
 */
export async function deleteStudent(studentId) {
    try {
        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            studentId
        );
    } catch (error) {
        console.error("Error deleting student:", error);
        throw error;
    }
}

export default {
    getStudents,
    getStudentById,
    getStudentByRegNo,
    createStudent,
    updateStudent,
    getStudentStats,
    deleteStudent,
};
