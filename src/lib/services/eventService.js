import { databases } from "../appwrite";
import { DB_CONFIG } from "../dbConfig";
import { ID, Query } from "appwrite";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

/**
 * Get all events
 */
export async function getEvents(limit = 50, offset = 0) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.EVENTS,
            [
                Query.orderDesc("$createdAt"),
                Query.limit(limit),
                Query.offset(offset),
            ]
        );
        return response;
    } catch (error) {
        console.error("Error getting events:", error);
        throw error;
    }
}

/**
 * Get events by IDs
 */
export async function getEventsByIds(eventIds) {
    if (!eventIds || eventIds.length === 0) return [];
    
    // Deduplicate IDs
    const uniqueIds = [...new Set(eventIds)];
    
    try {
        // Appwrite supports array for equal query for some attributes, but for $id it might be limited.
        // However, standard practice for fetching multiple docs by ID often involves multiple requests if array query isn't supported for $id.
        // Let's try Query.equal('$id', uniqueIds). If it fails, we fall back to Promise.all.
        // Actually, Appwrite documentation says Query.equal('$id', [id1, id2]) works.
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.EVENTS,
            [
                Query.equal("$id", uniqueIds),
                Query.limit(uniqueIds.length)
            ]
        );
        return response.documents;
    } catch (error) {
        console.error("Error getting events by IDs:", error);
        // Fallback: fetch individually
        try {
            const events = await Promise.all(
                uniqueIds.map(id => 
                    databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, id).catch(() => null)
                )
            );
            return events.filter(e => e !== null);
        } catch (fallbackError) {
             console.error("Fallback error getting events by IDs:", fallbackError);
             return [];
        }
    }
}

/**
 * Get event by ID
 */
export async function getEventById(eventId) {
    try {
        const event = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.EVENTS,
            eventId
        );
        return event;
    } catch (error) {
        console.error("Error getting event:", error);
        throw error;
    }
}

/**
 * Create new event
 */
export async function createEvent(data) {
    try {
        const requiredFields = ["event_name", "event_host", "event_description", "event_reg_deadline", "event_time", "event_url"];
        const missingFields = requiredFields.filter((field) => {
            const value = data?.[field];
            return value === undefined || value === null || String(value).trim() === "";
        });

        if (missingFields.length > 0) {
            throw new Error(`Missing required event fields: ${missingFields.join(", ")}`);
        }

        const event = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.EVENTS,
            ID.unique(),
            {
                event_name: String(data.event_name).trim(),
                event_host: String(data.event_host).trim(),
                event_description: String(data.event_description).trim(),
                event_reg_deadline: data.event_reg_deadline,
                event_time: data.event_time,
                event_url: String(data.event_url).trim(),
                participation_count: 0,
                view_count: 0,
            }
        );
        return event;
    } catch (error) {
        console.error("Error creating event:", error);
        throw error;
    }
}

/**
 * Update event
 */
export async function updateEvent(eventId, data) {
    try {
        const event = await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.EVENTS,
            eventId,
            data
        );
        return event;
    } catch (error) {
        console.error("Error updating event:", error);
        throw error;
    }
}

/**
 * Increment event view count
 */
export async function incrementViewCount(eventId) {
    try {
        const event = await getEventById(eventId);
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.EVENTS,
            eventId,
            { view_count: (event.view_count || 0) + 1 }
        );
    } catch (error) {
        console.error("Error incrementing view count:", error);
    }
}

/**
 * Increment participation count
 */
export async function incrementParticipationCount(eventId) {
    try {
        const event = await getEventById(eventId);
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.EVENTS,
            eventId,
            { participation_count: (event.participation_count || 0) + 1 }
        );
    } catch (error) {
        console.error("Error incrementing participation count:", error);
    }
}

/**
 * Decrement participation count
 */
export async function decrementParticipationCount(eventId) {
    try {
        const event = await getEventById(eventId);
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.EVENTS,
            eventId,
            { participation_count: Math.max((event.participation_count || 0) - 1, 0) }
        );
    } catch (error) {
        console.error("Error decrementing participation count:", error);
    }
}

/**
 * Delete event
 */
export async function deleteEvent(eventId) {
    try {
        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.EVENTS,
            eventId
        );
    } catch (error) {
        console.error("Error deleting event:", error);
        throw error;
    }
}

/**
 * Get event stats
 */
export async function getEventStats() {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.EVENTS,
            [Query.limit(1)]
        );
        return {
            total: response.total,
        };
    } catch (error) {
        console.error("Error getting event stats:", error);
        return { total: 0 };
    }
}

export default {
    getEvents,
    getEventsByIds,
    getEventById,
    createEvent,
    updateEvent,
    incrementViewCount,
    incrementParticipationCount,
    decrementParticipationCount,
    deleteEvent,
    getEventStats,
};
