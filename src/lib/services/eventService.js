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
        const event = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.EVENTS,
            ID.unique(),
            {
                event_name: data.event_name,
                event_host: data.event_host || null,
                event_description: data.event_description,
                event_image_url: data.event_image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
                event_reg_deadline: data.event_reg_deadline,
                event_time: data.event_time,
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

export default {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    incrementViewCount,
    incrementParticipationCount,
    deleteEvent,
};
