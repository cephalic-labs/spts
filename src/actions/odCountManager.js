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
import { updateStudent } from "@/lib/services/studentService";

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

  const categoryFieldsPresent = OD_CATEGORY_FIELDS.some(
    (field) => student?.[field] !== undefined && student?.[field] !== null,
  );
  if (categoryFieldsPresent) {
    payload.od_count = OD_CATEGORY_FIELDS.reduce((total, field) => {
      const nextValue =
        field === categoryField && OD_CATEGORY_FIELDS.includes(categoryField)
          ? Math.max(getStudentODValue(student, field) - 1, 0)
          : getStudentODValue(student, field);
      return total + nextValue;
    }, 0);
  } else if (student?.od_count !== undefined && student?.od_count !== null) {
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
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.STUDENTS,
      [Query.equal("appwrite_user_id", studentId), Query.limit(1)],
    );

    if (response.documents.length > 0) {
      const student = response.documents[0];
      if (categoryField) {
        const payload = buildDecrementPayload(student, categoryField);
        await updateStudent(student.$id, payload);
      } else {
        await decrementStudentODCount(student.$id);
      }
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
          if (categoryField) {
            const payload = buildDecrementPayload(student, categoryField);
            await updateStudent(student.$id, payload);
          } else {
            await decrementStudentODCount(student.$id);
          }
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

export async function resetStudentODCountsAtomic(studentDocId, role) {
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
  updateData.od_count = sumPolicyCounts(policy);

  await updateStudent(studentDocId, updateData);
}
