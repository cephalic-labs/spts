import { databases } from "../appwrite";
import { DB_CONFIG } from "../dbConfig";
import { ID, Query } from "appwrite";
import { secureLog } from "../secureLogger";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

function buildCollegePayload(data = {}) {
  return {
    college_name: String(data.college_name || "").trim(),
    rank:
      data.rank !== undefined && data.rank !== null && data.rank !== ""
        ? parseInt(data.rank, 10)
        : null,
  };
}

export async function getNIRFColleges(limit = 100, offset = 0, search = "") {
  try {
    const queries = [
      Query.orderAsc("college_name"),
      Query.limit(limit),
      Query.offset(offset),
    ];

    if (search && String(search).trim()) {
      queries.push(Query.contains("college_name", String(search).trim()));
    }

    return await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.NIRF_LIST,
      queries,
    );
  } catch (error) {
    secureLog.error("Error getting NIRF colleges:", error);
    throw error;
  }
}

export async function getNIRFCollegeById(collegeId) {
  try {
    return await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.NIRF_LIST,
      collegeId,
    );
  } catch (error) {
    if (error.code === 404 || error.message?.includes("could not be found")) {
      return null;
    }
    secureLog.error("Error getting NIRF college:", error);
    throw error;
  }
}

export async function createNIRFCollege(data) {
  try {
    const payload = buildCollegePayload(data);
    if (!payload.college_name) {
      throw new Error("College name is required");
    }
    if (payload.rank === null) {
      throw new Error("Rank is required");
    }

    return await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.NIRF_LIST,
      ID.unique(),
      payload,
    );
  } catch (error) {
    secureLog.error("Error creating NIRF college:", error);
    throw error;
  }
}

export async function updateNIRFCollege(collegeId, data) {
  try {
    const payload = buildCollegePayload(data);
    if (payload.college_name !== undefined && !payload.college_name) {
      throw new Error("College name is required");
    }
    if (payload.rank !== undefined && payload.rank === null) {
      throw new Error("Rank is required");
    }

    return await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.NIRF_LIST,
      collegeId,
      payload,
    );
  } catch (error) {
    secureLog.error("Error updating NIRF college:", error);
    throw error;
  }
}

export async function deleteNIRFCollege(collegeId) {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.NIRF_LIST,
      collegeId,
    );
  } catch (error) {
    secureLog.error("Error deleting NIRF college:", error);
    throw error;
  }
}

export default {
  getNIRFColleges,
  getNIRFCollegeById,
  createNIRFCollege,
  updateNIRFCollege,
  deleteNIRFCollege,
};
