import { databases } from "../appwrite";
import {
  DB_CONFIG,
  OD_STATUS,
  canRoleApprove,
  getNextStatus,
  OD_CATEGORY_FIELDS,
} from "../dbConfig";
import { ID, Query } from "appwrite";
import { updateStudent } from "./studentService";
import { secureLog } from "../secureLogger";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

function normalizeDateOnly(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const matchedDate = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (matchedDate) return matchedDate[1];
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isPendingStatus(status) {
  return typeof status === "string" && status.startsWith("pending_");
}

function normalizeCategoryField(value) {
  const normalized = String(value || "university")
    .trim()
    .toLowerCase();
  if (
    normalized === "iit_nit" ||
    normalized === "nirf" ||
    normalized === "industry" ||
    normalized === "others"
  ) {
    return normalized;
  }
  return "university";
}

function normalizeHostType(value) {
  if (!value) return "university";
  return String(value).trim().toLowerCase();
}

function getStudentODValue(studentRecord, field) {
  const value = studentRecord?.[field];
  if (value === undefined || value === null || value === "") return 0;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getStudentTotalOD(studentRecord) {
  const totalCount =
    studentRecord?.od_count !== undefined && studentRecord?.od_count !== null
      ? parseInt(studentRecord.od_count, 10)
      : 7;
  return Number.isNaN(totalCount) ? 7 : totalCount;
}

async function getStudentRecordForOD(studentAppwriteId, studentEmail) {
  if (!studentAppwriteId && !studentEmail) return null;

  if (studentAppwriteId) {
    // Try to get by Document ID first
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.STUDENTS, studentAppwriteId);
      if (doc) return doc;
    } catch (err) {
      // Ignore, continue to search by appwrite_user_id
    }

    try {
      const byAppwriteId = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STUDENTS,
        [Query.equal("appwrite_user_id", studentAppwriteId), Query.limit(1)],
      );
      if (byAppwriteId.documents.length > 0) {
        return byAppwriteId.documents[0];
      }
    } catch (error) {
      const isMissingAttr = String(error?.message || "").includes(
        "Attribute not found in schema",
      );
      if (!isMissingAttr) {
        throw error;
      }
    }
  }

  if (studentEmail) {
    try {
      const byEmail = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STUDENTS,
        [
          Query.equal("email", studentEmail.trim().toLowerCase()),
          Query.limit(1),
        ],
      );
      if (byEmail.documents.length > 0) {
        return byEmail.documents[0];
      }

      // Fallback: try original email casing
      const byEmailOriginal = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STUDENTS,
        [Query.equal("email", studentEmail), Query.limit(1)],
      );
      if (byEmailOriginal.documents.length > 0) {
        return byEmailOriginal.documents[0];
      }
    } catch (error) {
      secureLog.error("Error finding student by email:", error);
    }
  }

  return null;
}

async function getEventParticipation(eventId, studentId, additionalIds = []) {
  let searchStudentIds = [studentId, ...additionalIds];
  try {
    const studentRecord = await getStudentRecordForOD(studentId, null);
    if (studentRecord) {
      searchStudentIds.push(studentRecord.$id);
      if (studentRecord.appwrite_user_id) {
        searchStudentIds.push(studentRecord.appwrite_user_id);
      }
    }
  } catch (err) {}

  const uniqueIds = [...new Set(searchStudentIds)].filter(Boolean);

  for (const idToSearch of uniqueIds) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.EVENT_PARTICIPATIONS,
        [
          Query.equal("event_id", eventId),
          Query.equal("student_id", idToSearch),
          Query.limit(1),
        ],
      );
      if (response.documents && response.documents.length > 0) {
        return response.documents[0];
      }
    } catch (err) {
      // Continue to next ID if this one fails
    }
  }

  return null;
}

async function getDepartmentApprover(department, role) {
  if (!department || !role) return null;

  const normalizedDept = department.trim();
  const rolesToTry = [role.toLowerCase()];

  // Add common casing variants
  if (role.toLowerCase() === "hod") {
    rolesToTry.push("HOD", "Hod", "head of department");
  } else if (role.toLowerCase() === "coordinator") {
    rolesToTry.push("Coordinator", "COORDINATOR");
  }

  for (const tryRole of rolesToTry) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FACULTIES,
        [
          Query.equal("department", normalizedDept),
          Query.contains("role", tryRole),
          Query.limit(1),
        ],
      );
      if (response.documents.length > 0) return response.documents[0];
    } catch (error) {
      // Try next variant
    }
  }

  return null;
}

async function getFacultyByFacultyId(facultyId) {
  if (!facultyId) return null;

  try {
    // First try to get by Document ID (standard Appwrite relationship)
    const faculty = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.FACULTIES,
      facultyId,
    );
    return faculty;
  } catch (error) {
    // If not found by ID, try searching by faculty_id attribute (Employee ID)
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FACULTIES,
        [Query.equal("faculty_id", facultyId), Query.limit(1)],
      );
      return response.documents?.[0] || null;
    } catch (searchError) {
      secureLog.error("Error searching faculty:", searchError);
      return null;
    }
  }
}

/**
 * Create new OD request
 */
export async function createODRequest(data) {
  try {
    if (!data?.student_id || !data?.event_id) {
      throw new Error("Student and event are required for OD submission");
    }

    // Validate event
    let event;
    try {
      event = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        data.event_id,
      );
    } catch (err) {
      throw new Error("Selected event not found. It may have been deleted.");
    }

    const eventDate = normalizeDateOnly(event?.event_time);
    const eventHostType = normalizeHostType(event?.host_type);
    const eventCategory = normalizeCategoryField(eventHostType);
    const odStartDate = normalizeDateOnly(data.od_start_date);
    const odEndDate = normalizeDateOnly(data.od_end_date);

    if (!odStartDate || !odEndDate) {
      throw new Error("Please provide valid OD start and end dates.");
    }
    if (odStartDate > odEndDate) {
      throw new Error("OD start date cannot be after end date.");
    }
    if (!eventDate) {
      throw new Error("The selected event has no valid date configured.");
    }
    if (odStartDate > eventDate || odEndDate > eventDate) {
      throw new Error("OD dates must be on or before the event date.");
    }

    // Validate participation — search by student_id AND appwrite_user_id
    const participation = await getEventParticipation(
      data.event_id,
      data.student_id,
      [data.appwrite_user_id].filter(Boolean),
    );
    if (!participation || participation.status !== "participated") {
      throw new Error(
        "You can only request OD for events you have marked as 'Participated'. Go to Events page to update your participation status.",
      );
    }

    // Get student record
    const studentRecord = await getStudentRecordForOD(
      data.student_id,
      data.student_email || null,
    );
    if (!studentRecord) {
      throw new Error(
        "Your student profile was not found. Please contact your coordinator to add you to the system.",
      );
    }

    // Check OD count - block if student has exhausted their OD quota
    const currentODCount = getStudentTotalOD(studentRecord);
    if (currentODCount <= 0) {
      throw new Error(
        "You have exhausted all your OD requests for this semester. Please contact your advisor to get more ODs allocated.",
      );
    }

    // AUTO-SYNC: If student record exists but doesn't have appwrite_user_id yet, update it
    if (!studentRecord.appwrite_user_id && data.student_id) {
      try {
        await updateStudent(studentRecord.$id, {
          appwrite_user_id: data.student_id,
        });
        studentRecord.appwrite_user_id = data.student_id; // Update local copy
      } catch (syncErr) {
        secureLog.warn(
          "Failed to auto-sync appwrite_user_id to student profile",
        );
        // Continue anyway, this is non-critical for request creation
      }
    }

    // Validate mentor
    if (!data.mentor_id && !studentRecord.mentor_id) {
      throw new Error(
        "No mentor is assigned to your profile. Please select a mentor or contact your coordinator.",
      );
    }

    // Validate advisor
    const advisorId = studentRecord.advisor_id || null;
    let advisor = null;
    if (advisorId) {
      advisor = await getFacultyByFacultyId(advisorId);
    }
    if (!advisor) {
      throw new Error(
        "Your class advisor is not assigned or not found in the system. Please contact your coordinator to update your profile.",
      );
    }

    // Validate coordinator (optional - proceed without if not found)
    const coordinator = await getDepartmentApprover(
      studentRecord.department,
      "coordinator",
    );
    if (!coordinator) {
      throw new Error(
        `No coordinator is configured for the "${studentRecord.department}" department. Please contact your HOD or admin.`,
      );
    }

    // Validate HOD (optional - proceed without if not found)
    const hod = await getDepartmentApprover(studentRecord.department, "hod");
    if (!hod) {
      throw new Error(
        `No HOD is configured for the "${studentRecord.department}" department. Please contact your admin.`,
      );
    }

    const odRequest = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.OD_REQUESTS,
      ID.unique(),
      {
        od_id: ID.unique(),
        student_id: studentRecord.$id,
        event_id: data.event_id,
        od_start_date: odStartDate,
        od_end_date: odEndDate,
        reason: data.reason,
        attachments: data.attachments || [],
        current_status: OD_STATUS.PENDING_MENTOR,
        mentor_id: data.mentor_id || studentRecord.mentor_id,
        advisor_id: advisor ? advisor.$id : advisorId || null,
        coordinator_id: coordinator ? coordinator.$id : null,
        hod_id: hod ? hod.$id : null,
        final_decision: null,
        team: Array.isArray(data.team) ? data.team : [],
      },
    );
    return odRequest;
  } catch (error) {
    secureLog.error("Error creating OD request:", error);
    throw error;
  }
}

/**
 * Get OD requests by status for approval
 */
export async function getODRequestsByStatus(status, limit = 50, filters = {}) {
  try {
    const queries = [
      Query.equal("current_status", status),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ];

    if (filters.approverRole) {
      if (
        filters.approverIds &&
        Array.isArray(filters.approverIds) &&
        filters.approverIds.length > 0
      ) {
        // Check if role_id matches ANY of the provided IDs
        queries.push(
          Query.equal(`${filters.approverRole}_id`, filters.approverIds),
        );
      } else if (filters.approverId) {
        queries.push(
          Query.equal(`${filters.approverRole}_id`, filters.approverId),
        );
      }
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.OD_REQUESTS,
      queries,
    );
    return response;
  } catch (error) {
    secureLog.error("Error getting OD requests by status:", error);
    throw error;
  }
}

/**
 * Get OD requests for a specific student (including those where student is a team member)
 */
export async function getStudentODRequests(
  studentId,
  limit = 100,
  rollNo = null,
) {
  if (!studentId) {
    return { documents: [], total: 0 };
  }

  try {
    let searchStudentIds = [studentId];
    try {
      const studentRecord = await getStudentRecordForOD(studentId, null);
      if (studentRecord) {
        searchStudentIds.push(studentRecord.$id);
      }
    } catch (err) {}

    // Query for requests where the student is the creator
    const responseData = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.OD_REQUESTS,
      [
        Query.equal("student_id", searchStudentIds),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ],
    );

    // If no roll number provided or not available, just return creator requests
    if (!rollNo) {
      return responseData;
    }

    // Also query for requests where the student is in the team array
    try {
      const teamResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.OD_REQUESTS,
        [
          Query.contains("team", rollNo),
          Query.orderDesc("$createdAt"),
          Query.limit(limit),
        ],
      );

      if (teamResponse.documents.length > 0) {
        // Combine and remove duplicates
        const combinedDocs = [...responseData.documents];
        const existingIds = new Set(combinedDocs.map((doc) => doc.$id));

        teamResponse.documents.forEach((doc) => {
          if (!existingIds.has(doc.$id)) {
            combinedDocs.push(doc);
          }
        });

        // Sort by creation date descending
        combinedDocs.sort(
          (a, b) => new Date(b.$createdAt) - new Date(a.$createdAt),
        );

        return {
          documents: combinedDocs.slice(0, limit),
          total: Math.max(
            responseData.total,
            teamResponse.total,
            combinedDocs.length,
          ),
        };
      }
    } catch (teamError) {
      secureLog.warn("Failed to fetch team-based OD requests");
    }

    return responseData;
  } catch (error) {
    secureLog.error("Error getting student OD requests:", error);
    throw error;
  }
}

/**
 * Get OD request by ID
 */
export async function getODRequestById(odId) {
  try {
    const response = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.OD_REQUESTS,
      odId,
    );
    return response;
  } catch (error) {
    secureLog.error("Error getting OD request:", error);
    throw error;
  }
}

/**
 * Approve OD request - moves to next status
 * @deprecated Use approveODRequestSecure from @/actions/odApproval instead for client-side calls
 * This function should only be called from server-side code where approver identity is already validated
 */
export async function approveODRequest(
  odId,
  role,
  userId,
  remarks = "",
  approverId = null,
) {
  try {
    const odRequest = await getODRequestById(odId);
    const fromStatus = odRequest.current_status;

    if (!canRoleApprove(role, fromStatus)) {
      throw new Error(
        `Your role (${role}) cannot approve requests in '${fromStatus}' status.`,
      );
    }

    if (approverId && odRequest[`${role}_id`]) {
      const allowedIds = Array.isArray(approverId) ? approverId : [approverId];
      if (!allowedIds.includes(odRequest[`${role}_id`])) {
        throw new Error(
          "You are not assigned as the approver for this request.",
        );
      }
    }

    const toStatus = getNextStatus(fromStatus);
    if (!toStatus) {
      throw new Error(
        `No next approval step configured for '${fromStatus}'. Contact admin.`,
      );
    }
    const now = new Date().toISOString();

    // Update OD request
    const updateData = {
      current_status: toStatus,
    };

    // Set role-specific fields
    // Set role-specific fields (Commenting out to avoid schema validation errors if fields don't exist)
    /*
        if (role === "mentor") {
            updateData.mentor_status = "approved";
            updateData.mentor_remarks = remarks;
            updateData.mentor_action_at = now;
        } else if (role === "advisor") {
            updateData.advisor_status = "approved";
            updateData.advisor_remarks = remarks;
            updateData.advisor_action_at = now;
        } else if (role === "coordinator") {
            updateData.coordinator_status = "approved";
            updateData.coordinator_remarks = remarks;
            updateData.coordinator_action_at = now;
        } else if (role === "hod") {
            updateData.hod_status = "approved";
            updateData.hod_remarks = remarks;
            updateData.hod_action_at = now;
            updateData.final_decision = "granted";
        }
        */

    if (role === "hod") {
      updateData.final_decision = "granted";
    }

    const updatedOD = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.OD_REQUESTS,
      odId,
      updateData,
    );

    // If HOD granted, decrement the student's od_count AND all team members
    if (role === "hod") {
      try {
        // Decrement requesting student's od_count
        const studentRecord = await getStudentRecordForOD(
          odRequest.student_id,
          null,
        );
        if (studentRecord) {
          const currentCount = getStudentTotalOD(studentRecord);
          const newCount = Math.max(0, currentCount - 1);
          await updateStudent(studentRecord.$id, { od_count: newCount });
        }

        // Decrement team members' od_count
        const teamRollNumbers = odRequest.team || [];
        if (teamRollNumbers.length > 0) {
          const { getStudentByRollNo } = await import("./studentService");
          await Promise.all(
            teamRollNumbers.map(async (rollNo) => {
              try {
                const teamMember = await getStudentByRollNo(rollNo);
                if (teamMember) {
                  const memberCount = getStudentTotalOD(teamMember);
                  const newMemberCount = Math.max(0, memberCount - 1);
                  await updateStudent(teamMember.$id, {
                    od_count: newMemberCount,
                  });
                }
              } catch (teamErr) {
                secureLog.warn("Failed to decrement OD count for team member");
              }
            }),
          );
        }
      } catch (odCountErr) {
        secureLog.warn("Failed to decrement student OD count");
        // Non-critical: don't block the approval
      }
    }

    // Log the approval
    await logApproval(
      odId,
      fromStatus,
      toStatus,
      "approve",
      userId,
      role,
      remarks,
    );

    return updatedOD;
  } catch (error) {
    secureLog.error("Error approving OD request:", error);
    throw error;
  }
}

/**
 * Reject OD request
 * @deprecated Use rejectODRequestSecure from @/actions/odApproval instead for client-side calls
 * This function should only be called from server-side code where approver identity is already validated
 */
export async function rejectODRequest(
  odId,
  role,
  userId,
  remarks = "",
  approverId = null,
) {
  try {
    const odRequest = await getODRequestById(odId);
    const fromStatus = odRequest.current_status;

    if (!canRoleApprove(role, fromStatus)) {
      throw new Error(
        `Your role (${role}) cannot reject requests in '${fromStatus}' status.`,
      );
    }

    if (approverId && odRequest[`${role}_id`]) {
      const allowedIds = Array.isArray(approverId) ? approverId : [approverId];
      if (!allowedIds.includes(odRequest[`${role}_id`])) {
        throw new Error(
          "You are not assigned as the approver for this request.",
        );
      }
    }

    const now = new Date().toISOString();

    const updateData = {
      current_status: OD_STATUS.REJECTED,
      final_decision: "rejected",
    };

    // Set role-specific rejection fields
    // Set role-specific rejection fields (Commenting out to avoid schema validation errors)
    /*
        if (role === "mentor") {
            updateData.mentor_status = "rejected";
            updateData.mentor_remarks = remarks;
            updateData.mentor_action_at = now;
        } else if (role === "advisor") {
            updateData.advisor_status = "rejected";
            updateData.advisor_remarks = remarks;
            updateData.advisor_action_at = now;
        } else if (role === "coordinator") {
            updateData.coordinator_status = "rejected";
            updateData.coordinator_remarks = remarks;
            updateData.coordinator_action_at = now;
        } else if (role === "hod") {
            updateData.hod_status = "rejected";
            updateData.hod_remarks = remarks;
            updateData.hod_action_at = now;
        }
        */

    const updatedOD = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.OD_REQUESTS,
      odId,
      updateData,
    );

    // Log the rejection
    await logApproval(
      odId,
      fromStatus,
      OD_STATUS.REJECTED,
      "reject",
      userId,
      role,
      remarks,
    );

    return updatedOD;
  } catch (error) {
    secureLog.error("Error rejecting OD request:", error);
    throw error;
  }
}

/**
 * Cancel OD request by student
 */
export async function cancelODRequest(
  odId,
  studentUserId,
  remarks = "Cancelled by student",
) {
  try {
    if (!odId || !studentUserId) {
      throw new Error("OD request ID and student ID are required.");
    }

    const odRequest = await getODRequestById(odId);
    const fromStatus = odRequest.current_status;

    let validStudentIds = [studentUserId];
    try {
      const studentRecord = await getStudentRecordForOD(studentUserId, null);
      if (studentRecord) {
        validStudentIds.push(studentRecord.$id);
      }
    } catch (err) {}

    if (!validStudentIds.includes(odRequest.student_id)) {
      throw new Error("You can only cancel your own OD request.");
    }

    if (!isPendingStatus(fromStatus)) {
      throw new Error("Only pending OD requests can be cancelled.");
    }

    const updatedOD = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.OD_REQUESTS,
      odId,
      {
        current_status: OD_STATUS.CANCELLED,
        final_decision: "cancelled",
      },
    );

    await logApproval(
      odId,
      fromStatus,
      OD_STATUS.CANCELLED,
      "cancel",
      studentUserId,
      "student",
      remarks,
    );

    return updatedOD;
  } catch (error) {
    secureLog.error("Error cancelling OD request:", error);
    throw error;
  }
}

/**
 * Log approval action
 */
async function logApproval(
  odId,
  fromStatus,
  toStatus,
  action,
  userId,
  role,
  remarks,
) {
  try {
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.APPROVAL_LOGS,
      ID.unique(),
      {
        od_id: odId,
        from_status: fromStatus,
        to_status: toStatus,
        action: action,
        action_by_user_id: userId,
        action_by_role: role,
        remarks: remarks || null,
        action_at: new Date().toISOString(),
      },
    );
  } catch (error) {
    secureLog.error("Error logging approval:", error);
  }
}

/**
 * Get approval logs for a specific OD request
 */
export async function getApprovalLogsByODId(odId) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.APPROVAL_LOGS,
      [Query.equal("od_id", odId), Query.orderAsc("action_at")],
    );
    return response;
  } catch (error) {
    secureLog.error("Error getting approval logs:", error);
    throw error;
  }
}

/**
 * Get recent approval logs
 */
export async function getRecentApprovalLogs(limit = 20) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.APPROVAL_LOGS,
      [Query.orderDesc("action_at"), Query.limit(limit)],
    );
    return response;
  } catch (error) {
    secureLog.error("Error getting recent approval logs:", error);
    throw error;
  }
}

/**
 * Get all OD requests (for admin/sudo)
 */
export async function getAllODRequests(limit = null, studentIds = []) {
  try {
    const baseQueries = [Query.orderDesc("$createdAt")];

    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      baseQueries.push(Query.equal("student_id", studentIds));
    }

    // If limit is specified, use it directly
    if (limit) {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.OD_REQUESTS,
        [...baseQueries, Query.limit(limit)],
      );
      return response;
    }

    // Otherwise, fetch all records using pagination
    let allDocuments = [];
    let lastId = null;
    const pageSize = 100;

    while (true) {
      const queries = [...baseQueries, Query.limit(pageSize)];
      if (lastId) {
        queries.push(Query.cursorAfter(lastId));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.OD_REQUESTS,
        queries,
      );

      allDocuments.push(...response.documents);

      if (response.documents.length < pageSize) break;
      lastId = response.documents[response.documents.length - 1].$id;
    }

    return { documents: allDocuments, total: allDocuments.length };
  } catch (error) {
    secureLog.error("Error getting all OD requests:", error);
    throw error;
  }
}

/**
 * Get OD request stats (total, pending, approved, rejected)
 */
export async function getODStats(filter = {}) {
  try {
    const queries = [];
    if (filter.student_id) {
      let validStudentIds = [filter.student_id];
      try {
        const studentRecord = await getStudentRecordForOD(filter.student_id, null);
        if (studentRecord) {
          validStudentIds.push(studentRecord.$id);
        }
      } catch (err) {}
      queries.push(Query.equal("student_id", validStudentIds));
    }

    // Fetch all documents using pagination
    let documents = [];
    let lastId = null;
    const pageSize = 100;

    while (true) {
      const pageQueries = [...queries, Query.limit(pageSize)];
      if (lastId) {
        pageQueries.push(Query.cursorAfter(lastId));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.OD_REQUESTS,
        pageQueries,
      );

      documents.push(...response.documents);

      if (response.documents.length < pageSize) break;
      lastId = response.documents[response.documents.length - 1].$id;
    }

    // If filtering for a specific student, also fetch where they are in the team
    if (filter.student_id && filter.rollNo) {
      try {
        let teamDocs = [];
        let teamLastId = null;

        while (true) {
          const teamQueries = [
            Query.contains("team", filter.rollNo),
            Query.limit(pageSize),
          ];
          if (teamLastId) {
            teamQueries.push(Query.cursorAfter(teamLastId));
          }

          const teamResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.OD_REQUESTS,
            teamQueries,
          );

          teamDocs.push(...teamResponse.documents);

          if (teamResponse.documents.length < pageSize) break;
          teamLastId =
            teamResponse.documents[teamResponse.documents.length - 1].$id;
        }

        if (teamDocs.length > 0) {
          const existingIds = new Set(documents.map((d) => d.$id));
          teamDocs.forEach((doc) => {
            if (!existingIds.has(doc.$id)) {
              documents.push(doc);
            }
          });
        }
      } catch (teamErr) {
        secureLog.warn("Failed to fetch team stats");
      }
    }

    const stats = {
      total: documents.length,
      pending: documents.filter((d) => d.current_status?.startsWith("pending"))
        .length,
      approved: documents.filter(
        (d) =>
          d.current_status === OD_STATUS.GRANTED ||
          d.current_status === OD_STATUS.APPROVED,
      ).length,
      rejected: documents.filter((d) => d.current_status === OD_STATUS.REJECTED)
        .length,
    };

    return stats;
  } catch (error) {
    secureLog.error("Error getting OD stats:", error);
    return { total: 0, pending: 0, approved: 0, rejected: 0 };
  }
}

export default {
  createODRequest,
  getODRequestsByStatus,
  getStudentODRequests,
  getODRequestById,
  approveODRequest,
  rejectODRequest,
  cancelODRequest,
  getAllODRequests,
  getApprovalLogsByODId,
  getRecentApprovalLogs,
  getODStats,
};
