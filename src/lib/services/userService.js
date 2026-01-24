import { databases } from "../appwrite";
import { DB_CONFIG } from "../dbConfig";
import { ID, Query } from "appwrite";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

/**
 * Sync Appwrite user to Users collection
 * Creates new user if doesn't exist, returns existing user if found
 */
export async function syncUserToDatabase(appwriteUser) {
    try {
        // Check if user already exists
        const existingUser = await getUserByAppwriteId(appwriteUser.$id);

        if (existingUser) {
            // User exists, return with merged data
            return existingUser;
        }

        // Create new user document
        const newUser = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            ID.unique(),
            {
                user_id: appwriteUser.$id,
                user_name: appwriteUser.name || "User",
                user_email: appwriteUser.email,
                profile_url: "https://randomuser.me/api/portraits/thumb/men/93.jpg",
                role: "unassigned",
            }
        );

        return newUser;
    } catch (error) {
        console.error("Error syncing user to database:", error);
        throw error;
    }
}

/**
 * Get user document by Appwrite user ID
 */
export async function getUserByAppwriteId(appwriteUserId) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.USERS,
            [Query.equal("user_id", appwriteUserId)]
        );

        return response.documents.length > 0 ? response.documents[0] : null;
    } catch (error) {
        console.error("Error getting user by Appwrite ID:", error);
        return null;
    }
}

/**
 * Update user role
 */
export async function updateUserRole(documentId, role) {
    try {
        const updatedUser = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            documentId,
            { role }
        );
        return updatedUser;
    } catch (error) {
        console.error("Error updating user role:", error);
        throw error;
    }
}

/**
 * Update user profile
 */
export async function updateUserProfile(documentId, data) {
    try {
        const updatedUser = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            documentId,
            data
        );
        return updatedUser;
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
}

/**
 * Get all users (for admin)
 */
export async function getAllUsers(limit = 100, offset = 0) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.USERS,
            [Query.limit(limit), Query.offset(offset)]
        );
        return response;
    } catch (error) {
        console.error("Error getting all users:", error);
        throw error;
    }
}

export default {
    syncUserToDatabase,
    getUserByAppwriteId,
    updateUserRole,
    updateUserProfile,
    getAllUsers,
};
