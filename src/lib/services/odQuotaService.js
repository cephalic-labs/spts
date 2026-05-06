import { databases } from "../appwrite";
import { DB_CONFIG, OD_CATEGORY_FIELDS } from "../dbConfig";
import { ID, Query } from "appwrite";
import { secureLog } from "../secureLogger";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

function normalizeQuotaValue(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildQuotaPayload(data = {}) {
  const payload = {};

  for (const field of OD_CATEGORY_FIELDS) {
    if (data[field] !== undefined) {
      payload[field] = normalizeQuotaValue(data[field]);
    }
  }

  return payload;
}

export async function getODQuotaPolicy() {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.OD_QUOTA,
      [Query.limit(1)],
    );

    return response.documents?.[0] || null;
  } catch (error) {
    secureLog.error("Error getting OD quota policy:", error);
    throw error;
  }
}

export async function createODQuotaPolicy(data) {
  try {
    const payload = buildQuotaPayload(data);
    return await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.OD_QUOTA,
      ID.unique(),
      payload,
    );
  } catch (error) {
    secureLog.error("Error creating OD quota policy:", error);
    throw error;
  }
}

export async function updateODQuotaPolicy(policyId, data) {
  try {
    const payload = buildQuotaPayload(data);
    return await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.OD_QUOTA,
      policyId,
      payload,
    );
  } catch (error) {
    secureLog.error("Error updating OD quota policy:", error);
    throw error;
  }
}

export async function saveODQuotaPolicy(data) {
  const existingPolicy = await getODQuotaPolicy();

  if (existingPolicy) {
    return updateODQuotaPolicy(existingPolicy.$id, data);
  }

  return createODQuotaPolicy(data);
}

export default {
  getODQuotaPolicy,
  createODQuotaPolicy,
  updateODQuotaPolicy,
  saveODQuotaPolicy,
};
