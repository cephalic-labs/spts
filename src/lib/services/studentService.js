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
        if (filters.search) {
            queries.push(Query.contains("name", filters.search));
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
        if (error.code === 404 || error.message?.includes("could not be found")) {
            return null;
        }
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
 * Get student by Appwrite user ID
 */
export async function getStudentByAppwriteUserId(appwriteUserId) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            [Query.equal("appwrite_user_id", appwriteUserId), Query.limit(1)]
        );
        return response.documents.length > 0 ? response.documents[0] : null;
    } catch (error) {
        if (String(error?.message || "").includes("Attribute not found in schema")) {
            return null;
        }
        console.error("Error getting student by Appwrite user ID:", error);
        throw error;
    }
}

/**
 * Get student by email
 */
export async function getStudentByEmail(email) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            [Query.equal("email", email), Query.limit(1)]
        );
        if (response.documents.length > 0) return response.documents[0];

        // Fallback: try lowercase email
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail !== email) {
            const response2 = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.STUDENTS,
                [Query.equal("email", normalizedEmail), Query.limit(1)]
            );
            if (response2.documents.length > 0) return response2.documents[0];
        }

        return null;
    } catch (error) {
        console.error("Error getting student by email:", error);
        throw error;
    }
}

/**
 * Create new student
 */
export async function createStudent(data) {
    const payload = {
        student_register_no: data.student_register_no,
        appwrite_user_id: data.appwrite_user_id || null,
        roll_no: data.roll_no,
        name: data.name,
        email: data.email,
        department: data.department,
        year: parseInt(data.year),
        section: data.section,
        phone: data.phone ? parseInt(String(data.phone).replace(/\D/g, '')) : null,
        cgpa: (data.cgpa !== undefined && data.cgpa !== "" && data.cgpa !== null) ? parseFloat(data.cgpa) : null,
        advisor_id: data.advisor_id || null,
        mentor_id: data.mentor_id || null,
        status: data.status || "active",
    };

    try {
        return await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            ID.unique(),
            payload
        );
    } catch (error) {
        if (error.message?.includes("Unknown attribute")) {
            const missingAttr = error.message.match(/"([^"]+)"/)?.[1];
            if (missingAttr && payload[missingAttr] !== undefined) {
                console.warn(`Retrying create without missing attribute: ${missingAttr}`);
                const { [missingAttr]: _, ...retryPayload } = payload;
                // Note: We need to handle the recursive case differently for create because ID.unique() should only be called once or we use a fixed ID
                return await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.STUDENTS,
                    ID.unique(),
                    retryPayload
                );
            }
        }
        console.error("Error creating student:", error);
        throw error;
    }
}

export async function updateStudent(studentId, data) {
    const updateData = { ...data };

    // Type casting
    if (updateData.year) updateData.year = parseInt(updateData.year);
    if (updateData.cgpa !== undefined && updateData.cgpa !== "") {
        updateData.cgpa = parseFloat(updateData.cgpa);
    }
    if (updateData.phone !== undefined) {
        updateData.phone = updateData.phone ? parseInt(String(updateData.phone).replace(/\D/g, '')) : null;
    }

    try {
        return await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            studentId,
            updateData
        );
    } catch (error) {
        if (error.message?.includes("Unknown attribute")) {
            const missingAttr = error.message.match(/"([^"]+)"/)?.[1];
            if (missingAttr && updateData[missingAttr] !== undefined) {
                console.warn(`Retrying update without missing attribute: ${missingAttr}`);
                const { [missingAttr]: _, ...retryData } = updateData;
                return await updateStudent(studentId, retryData); // Recursive call with one less attribute
            }
        }
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

/**
 * Get multiple students by their IDs
 */
export async function getStudentsByIds(ids) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            [Query.equal("$id", ids), Query.limit(ids.length)]
        );
        return response.documents;
    } catch (error) {
        console.error("Error getting students by IDs:", error);
        return [];
    }
}

/**
 * Get multiple students by their Appwrite User IDs
 */
export async function getStudentsByAppwriteUserIds(ids, limit = 100) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.STUDENTS,
            [Query.equal("appwrite_user_id", ids), Query.limit(limit)]
        );
        return response.documents;
    } catch (error) {
        console.error("Error getting students by Appwrite User IDs:", error);
        return [];
    }
}

export default {
    getStudents,
    getStudentById,
    getStudentByRegNo,
    getStudentByAppwriteUserId,
    getStudentByEmail,
    getStudentsByIds,
    getStudentsByAppwriteUserIds,
    createStudent,
    updateStudent,
    getStudentStats,
    deleteStudent,
};
