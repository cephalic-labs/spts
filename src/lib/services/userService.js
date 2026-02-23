import { databases } from "../appwrite";
import { DB_CONFIG } from "../dbConfig";
import { ID, Query } from "appwrite";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

// Mapping between frontend roles/labels and database Enum values
const ROLE_MAP = {
    "sudo": "super_admin",
    "faculty": "mentor" // Faculty role doesn't exist in USERS Enum, defaulting to mentor
};

const REVERSE_ROLE_MAP = Object.fromEntries(
    Object.entries(ROLE_MAP).map(([k, v]) => [v, k])
);

/**
 * Convert frontend role to database-safe Enum value
 */
function toDbRole(role) {
    return ROLE_MAP[role] || role;
}

/**
 * Convert database Enum value back to frontend/label role
 */
function fromDbRole(role) {
    // If we have a reverse mapping, use it (e.g. super_admin -> sudo)
    // Otherwise return as is
    return REVERSE_ROLE_MAP[role] || role;
}


/**
 * Sync Appwrite user to Users collection
 * Creates new user if doesn't exist, returns existing user if found
 */
export async function syncUserToDatabase(appwriteUser) {
    try {
        // Check if user already exists
        const existingUser = await getUserByAppwriteId(appwriteUser.$id);

        if (existingUser) {
            // If user's DB role is still 'unassigned' but Auth now has proper labels, sync it
            const authRole = (appwriteUser.labels && appwriteUser.labels.length > 0) ? appwriteUser.labels[0] : null;
            if (existingUser.role === "unassigned" && authRole) {
                try {
                    const updatedUser = await updateUserRole(existingUser.$id, authRole);
                    return updatedUser;
                } catch (e) {
                    console.error("Failed to sync role for existing user:", e);
                }
            }
            // User exists, return with merged data
            return existingUser;
        }

        // Create new user document
        try {
            const newUser = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                ID.unique(),
                {
                    user_id: appwriteUser.$id,
                    user_name: appwriteUser.name || "User",
                    user_email: appwriteUser.email,
                    profile_url: "https://randomuser.me/api/portraits/thumb/men/93.jpg",
                    role: toDbRole((appwriteUser.labels && appwriteUser.labels.length > 0) ? appwriteUser.labels[0] : "unassigned"),
                }
            );
            return newUser;
        } catch (createError) {
            // Handle race condition: if another request already created the user
            if (String(createError?.message || "").includes("Document with the requested ID already exists") ||
                String(createError?.code) === "409") {
                const existingUser2 = await getUserByAppwriteId(appwriteUser.$id);
                if (existingUser2) return existingUser2;
            }
            throw createError;
        }
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
            [Query.equal("user_id", appwriteUserId), Query.limit(1)]
        );

        if (response.documents.length > 0) {
            const user = response.documents[0];
            return {
                ...user,
                role: fromDbRole(user.role)
            };
        }
        return null;
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
            { role: toDbRole(role) }
        );
        return {
            ...updatedUser,
            role: fromDbRole(updatedUser.role)
        };
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
            updateData
        );
        return {
            ...updatedUser,
            role: fromDbRole(updatedUser.role)
        };
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
        return {
            ...response,
            documents: response.documents.map(u => ({
                ...u,
                role: fromDbRole(u.role)
            }))
        };
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
