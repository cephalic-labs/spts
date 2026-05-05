import { databases } from "../appwrite";
import { DB_CONFIG } from "../dbConfig";
import { ID, Query } from "appwrite";
import { secureLog } from "../secureLogger";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

function normalizeHostType(value) {
  if (!value) return "university";
  return String(value).trim().toLowerCase();
}

function normalizeEventPayload(data = {}, options = {}) {
  const { partial = false } = options;
  const hostType = normalizeHostType(data.event_host_type || data.host_type);
  const payload = {};

  if (!partial || data.event_name !== undefined) {
    payload.event_name = String(data.event_name || "").trim();
  }
  if (
    !partial ||
    data.event_host !== undefined ||
    data.event_host_name !== undefined
  ) {
    payload.event_host = String(
      data.event_host || data.event_host_name || "",
    ).trim();
  }
  if (!partial || data.event_description !== undefined) {
    payload.event_description = String(data.event_description || "").trim();
  }
  if (!partial || data.event_reg_deadline !== undefined) {
    payload.event_reg_deadline = data.event_reg_deadline;
  }
  if (!partial || data.event_time !== undefined) {
    payload.event_time = data.event_time;
  }
  if (!partial || data.event_url !== undefined) {
    payload.event_url = String(data.event_url || "").trim();
  }
  if (
    !partial ||
    data.event_category !== undefined ||
    data.event_host_type !== undefined ||
    data.host_type !== undefined
  ) {
    payload.event_category = String(data.event_category || hostType)
      .trim()
      .toLowerCase();
    payload.event_host_type = hostType;
  }
  if (!partial || data.nirf_college_id !== undefined) {
    payload.nirf_college_id = data.nirf_college_id || null;
  }
  if (!partial || data.participation_count !== undefined) {
    payload.participation_count =
      data.participation_count !== undefined
        ? parseInt(data.participation_count, 10) || 0
        : 0;
  }
  if (!partial || data.view_count !== undefined) {
    payload.view_count =
      data.view_count !== undefined ? parseInt(data.view_count, 10) || 0 : 0;
  }

  return payload;
}

/**
 * Get all events
 */
export async function getEvents(limit = 50, offset = 0) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENTS,
      [Query.orderDesc("$createdAt"), Query.limit(limit), Query.offset(offset)],
    );
    return response;
  } catch (error) {
    secureLog.error("Error getting events:", error);
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
      [Query.equal("$id", uniqueIds), Query.limit(uniqueIds.length)],
    );
    return response.documents;
  } catch (error) {
    secureLog.error("Error getting events by IDs:", error);
    // Fallback: fetch individually
    try {
      const events = await Promise.all(
        uniqueIds.map((id) =>
          databases
            .getDocument(DATABASE_ID, COLLECTIONS.EVENTS, id)
            .catch(() => null),
        ),
      );
      return events.filter((e) => e !== null);
    } catch (fallbackError) {
      secureLog.error("Fallback error getting events by IDs:", fallbackError);
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
      eventId,
    );
    return event;
  } catch (error) {
    secureLog.error("Error getting event:", error);
    throw error;
  }
}

/**
 * Create new event
 */
export async function createEvent(data) {
  try {
    const requiredFields = [
      "event_name",
      "event_host",
      "event_description",
      "event_reg_deadline",
      "event_time",
      "event_url",
    ];
    const missingFields = requiredFields.filter((field) => {
      const value = data?.[field];
      return (
        value === undefined || value === null || String(value).trim() === ""
      );
    });

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required event fields: ${missingFields.join(", ")}`,
      );
    }

    const event = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.EVENTS,
      ID.unique(),
      normalizeEventPayload(data),
    );
    return event;
  } catch (error) {
    secureLog.error("Error creating event:", error);
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
      normalizeEventPayload(data, { partial: true }),
    );
    return event;
  } catch (error) {
    secureLog.error("Error updating event:", error);
    throw error;
  }
}

/**
 * Increment event view count
 */
export async function incrementViewCount(eventId) {
  try {
    const event = await getEventById(eventId);
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId, {
      view_count: (event.view_count || 0) + 1,
    });
  } catch (error) {
    secureLog.error("Error incrementing view count:", error);
  }
}

/**
 * Increment participation count with retry logic
 */
export async function incrementParticipationCount(eventId, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const event = await getEventById(eventId);
      const currentCount = event.participation_count || 0;
      const updatedAt = event.$updatedAt;

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        eventId,
        { participation_count: currentCount + 1 },
      );

      if (updated.$updatedAt !== updatedAt) {
        return;
      }
    } catch (error) {
      if (attempt === maxRetries - 1) {
        secureLog.error("Error incrementing participation count:", error);
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
}

/**
 * Decrement participation count with retry logic
 */
export async function decrementParticipationCount(eventId, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const event = await getEventById(eventId);
      const currentCount = event.participation_count || 0;
      const updatedAt = event.$updatedAt;

      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        eventId,
        { participation_count: Math.max(currentCount - 1, 0) },
      );

      if (updated.$updatedAt !== updatedAt) {
        return;
      }
    } catch (error) {
      if (attempt === maxRetries - 1) {
        secureLog.error("Error decrementing participation count:", error);
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
}

/**
 * Delete event
 */
export async function deleteEvent(eventId) {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
  } catch (error) {
    secureLog.error("Error deleting event:", error);
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
      [Query.limit(1)],
    );
    return {
      total: response.total,
    };
  } catch (error) {
    secureLog.error("Error getting event stats:", error);
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
