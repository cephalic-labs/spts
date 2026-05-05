import { databases } from "../appwrite";
import { DB_CONFIG } from "../dbConfig";
import { ID, Query } from "appwrite";
import { secureLog } from "../secureLogger";

/**
 * Generate a default profile URL using UI Avatars (reliable, free service)
 * Falls back to a data URI if name is not available
 */
function generateDefaultProfileUrl(name, email) {
    if (name && name !== "User") {
        const encodedName = encodeURIComponent(name);
        return `https://ui-avatars.com/api/?name=${encodedName}&background=random&size=128`;
    }
    // Fallback: use first letter of email
    if (email) {
        const initial = email.charAt(0).toUpperCase();
        return `https://ui-avatars.com/api/?name=${initial}&background=random&size=128`;
    }
    // Last resort: generic user icon
    return `https://ui-avatars.com/api/?name=U&background=cccccc&color=666&size=128`;
}

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
    const MAX_RETRIES = 5;
    const BASE_DELAY = 100;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const existingUser = await getUserByAppwriteId(appwriteUser.$id);

            if (existingUser) {
                const authRole = (appwriteUser.labels && appwriteUser.labels.length > 0) ? appwriteUser.labels[0] : null;
                if (existingUser.role === "unassigned" && authRole) {
                    try {
                        return await updateUserRole(existingUser.$id, authRole);
                    } catch (e) {
                        secureLog.error("Failed to sync role for existing user:", e);
                    }
                }
                return existingUser;
            }

            try {
                return await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    ID.unique(),
                    {
                        user_id: appwriteUser.$id,
                        user_name: appwriteUser.name || "User",
                        user_email: appwriteUser.email,
                        profile_url: generateDefaultProfileUrl(appwriteUser.name, appwriteUser.email),
                        role: toDbRole((appwriteUser.labels && appwriteUser.labels.length > 0) ? appwriteUser.labels[0] : "unassigned"),
                    }
                );
            } catch (createError) {
                if (String(createError?.message || "").includes("Document with the requested ID already exists") ||
                    String(createError?.code) === "409") {
                    await new Promise(resolve => setTimeout(resolve, BASE_DELAY * Math.pow(2, attempt)));
                    continue;
                }
                throw createError;
            }
        } catch (error) {
            if (attempt === MAX_RETRIES - 1) {
                secureLog.error("Error syncing user to database after retries:", error);
                return null;
            }
        }
    }
    
    return null;
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
        secureLog.error("Error getting user by Appwrite ID:", error);
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
        secureLog.error("Error updating user role:", error);
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
        return {
            ...updatedUser,
            role: fromDbRole(updatedUser.role)
        };
    } catch (error) {
        secureLog.error("Error updating user profile:", error);
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
        secureLog.error("Error getting all users:", error);
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
