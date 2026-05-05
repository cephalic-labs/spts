"use server";

import { databases } from "@/lib/server/appwrite";
import {
  DB_CONFIG,
  ADMIN_SUDO_ROLES,
  OD_CATEGORY_FIELDS,
} from "@/lib/dbConfig";
import { Query } from "node-appwrite";
import { secureLog } from "@/lib/secureLogger";
import { getODQuotaPolicy } from "@/lib/services/odQuotaService";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

function sumPolicyCounts(policy) {
  return OD_CATEGORY_FIELDS.reduce((total, field) => {
    const value = policy?.[field];
    return (
      total +
      (typeof value === "number" ? value : parseInt(value || 0, 10) || 0)
    );
  }, 0);
}

async function updateStudentServer(studentId, data) {
  const updateData = { ...data };

  if (updateData.year) updateData.year = parseInt(updateData.year);
  if (updateData.od_count !== undefined && updateData.od_count !== "") {
    updateData.od_count = parseInt(updateData.od_count);
  }

  for (const field of OD_CATEGORY_FIELDS) {
    if (updateData[field] !== undefined && updateData[field] !== "") {
      updateData[field] = parseInt(updateData[field]);
    }
  }

  try {
    return await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.STUDENTS,
      studentId,
      updateData,
    );
  } catch (error) {
    secureLog.error("Error updating student:", error);
    throw error;
  }
}

async function decrementStudentODCount(studentDocId) {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const student = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.STUDENTS,
        studentDocId,
      );
      const currentCount = student.od_count ?? 7;
      const newCount = Math.max(0, currentCount - 1);

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.STUDENTS,
        studentDocId,
        { od_count: newCount },
      );
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) {
        throw error;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, 100 * Math.pow(2, attempt)),
      );
    }
  }
}

function getStudentODValue(student, field) {
  const value = student?.[field];
  if (value === undefined || value === null || value === "") return 0;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildDecrementPayload(student, categoryField = null) {
  const payload = {};

  if (categoryField && OD_CATEGORY_FIELDS.includes(categoryField)) {
    const currentValue = getStudentODValue(student, categoryField);
    payload[categoryField] = Math.max(currentValue - 1, 0);
  }

  // Always decrement od_count by 1
  if (student?.od_count !== undefined && student?.od_count !== null) {
    const legacyCount = parseInt(student.od_count, 10);
    payload.od_count = Math.max(
      Number.isNaN(legacyCount) ? 0 : legacyCount - 1,
      0,
    );
  }

  return payload;
}

export async function decrementODCountAtomic(studentId, categoryField = null) {
  try {
    let student = null;

    // Try to get by Document ID first
    try {
      student = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.STUDENTS,
        studentId
      );
    } catch (err) {
      // Fallback: Try searching by appwrite_user_id
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STUDENTS,
        [Query.equal("appwrite_user_id", studentId), Query.limit(1)],
      );
      if (response.documents.length > 0) {
        student = response.documents[0];
      }
    }

    if (student) {
      const payload = buildDecrementPayload(student, categoryField);
      await updateStudentServer(student.$id, payload);
    }
  } catch (error) {
    secureLog.warn("Failed to decrement OD count:", error);
  }
}

export async function decrementTeamODCountsAtomic(
  teamRollNumbers,
  categoryField = null,
) {
  if (!teamRollNumbers?.length) return;

  const results = await Promise.allSettled(
    teamRollNumbers.map(async (rollNo) => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.STUDENTS,
          [Query.equal("roll_no", rollNo), Query.limit(1)],
        );

        if (response.documents.length > 0) {
          const student = response.documents[0];
          const payload = buildDecrementPayload(student, categoryField);
          await updateStudentServer(student.$id, payload);
        }
      } catch (error) {
        secureLog.warn("Failed to decrement team member OD count:", error);
        throw error;
      }
    }),
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    secureLog.warn(
      `${failures.length}/${teamRollNumbers.length} team OD count updates failed`,
    );
  }
}

export async function resetStudentODCountsAtomic(
  studentDocId,
  role,
  customTotal = null,
) {
  if (!ADMIN_SUDO_ROLES.includes(role)) {
    throw new Error("Only admin and sudo can reset OD counts.");
  }

  const policy = await getODQuotaPolicy();
  if (!policy) {
    throw new Error("OD quota policy not found. Please configure it first.");
  }

  const updateData = {};
  for (const field of OD_CATEGORY_FIELDS) {
    updateData[field] = parseInt(policy[field] || 0, 10) || 0;
  }
  updateData.od_count =
    customTotal !== null ? parseInt(customTotal, 10) : sumPolicyCounts(policy);

  await updateStudentServer(studentDocId, updateData);
}

export async function resetStudentsByYearAtomic(
  year,
  role,
  customTotal = null,
) {
  if (!ADMIN_SUDO_ROLES.includes(role)) {
    throw new Error("Only admin and sudo can reset OD counts.");
  }

  const policy = await getODQuotaPolicy();
  if (!policy) {
    throw new Error("OD quota policy not found. Please configure it first.");
  }

  const updateData = {};
  for (const field of OD_CATEGORY_FIELDS) {
    updateData[field] = parseInt(policy[field] || 0, 10) || 0;
  }
  updateData.od_count =
    customTotal !== null ? parseInt(customTotal, 10) : sumPolicyCounts(policy);

  const queries = [Query.equal("year", parseInt(year, 10))];
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  let totalUpdated = 0;

  while (hasMore) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.STUDENTS,
      [...queries, Query.limit(limit), Query.offset(offset)],
    );

    if (response.documents.length === 0) {
      hasMore = false;
      break;
    }

    await Promise.all(
      response.documents.map((student) =>
        updateStudentServer(student.$id, updateData),
      ),
    );

    totalUpdated += response.documents.length;
    offset += limit;

    if (response.documents.length < limit) {
      hasMore = false;
    }
  }

  return totalUpdated;
}

export async function promoteStudentsByYearAtomic(
  fromYear,
  toYear,
  role,
  department = null,
) {
  if (!ADMIN_SUDO_ROLES.includes(role)) {
    throw new Error("Only admin and sudo can promote students.");
  }

  const queries = [Query.equal("year", parseInt(fromYear, 10))];
  if (department && department.trim() !== "") {
    queries.push(Query.equal("department", department.trim()));
  }

  const updateData = { year: parseInt(toYear, 10) };

  let offset = 0;
  const limit = 100;
  let hasMore = true;
  let totalUpdated = 0;

  while (hasMore) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.STUDENTS,
      [...queries, Query.limit(limit), Query.offset(offset)],
    );

    if (response.documents.length === 0) {
      hasMore = false;
      break;
    }

    await Promise.all(
      response.documents.map((student) =>
        updateStudentServer(student.$id, updateData),
      ),
    );

    totalUpdated += response.documents.length;
    offset += limit;

    if (response.documents.length < limit) {
      hasMore = false;
    }
  }

  return totalUpdated;
}
