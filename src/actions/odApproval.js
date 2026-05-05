"use server";

import { databases } from "@/lib/server/appwrite";
import {
  DB_CONFIG,
  canRoleApprove,
  getNextStatus,
  OD_STATUS,
} from "@/lib/dbConfig";
import { Query } from "node-appwrite";
import { cookies } from "next/headers";
import { secureLog } from "@/lib/secureLogger";
import {
  decrementODCountAtomic,
  decrementTeamODCountsAtomic,
} from "./odCountManager";

const { DATABASE_ID, COLLECTIONS } = DB_CONFIG;

async function getFacultyByAppwriteUserId(userId, userEmail = null) {
  if (!userId && !userEmail) return null;

  try {
    if (userId) {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FACULTIES,
        [Query.equal("appwrite_user_id", userId), Query.limit(1)],
      );
      if (response.documents.length > 0) return response.documents[0];

      try {
        const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.FACULTIES, userId);
        if (doc) return doc;
      } catch (err) {
        // Ignore, userId is not a valid faculty document ID
      }
    }

    if (userEmail) {
      const response2 = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FACULTIES,
        [Query.equal("email", userEmail), Query.limit(1)],
      );
      if (response2.documents.length > 0) return response2.documents[0];

      const normalizedEmail = userEmail.trim().toLowerCase();
      if (normalizedEmail !== userEmail) {
        const response3 = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.FACULTIES,
          [Query.equal("email", normalizedEmail), Query.limit(1)],
        );
        if (response3.documents.length > 0) return response3.documents[0];
      }
    }

    return null;
  } catch (error) {
    secureLog.error("Error fetching faculty by user ID/Email:", error);
    return null;
  }
}

async function getODRequestById(odId) {
  return await databases.getDocument(
    DATABASE_ID,
    COLLECTIONS.OD_REQUESTS,
    odId,
  );
}

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
    const { ID } = await import("node-appwrite");
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

export async function approveODRequestSecure(odId, userId, remarks = "", userEmail = null) {
  try {
    if (!userId && !userEmail) throw new Error("User ID or Email is required");

    const faculty = await getFacultyByAppwriteUserId(userId, userEmail);
    if (!faculty) {
      throw new Error("Faculty profile not found. Contact administrator.");
    }

    const facultyRoles = Array.isArray(faculty.role) ? faculty.role : [faculty.role];
    const facultyIds = [faculty.faculty_id, faculty.$id].filter(Boolean);

    // Get OD request
    const odRequest = await getODRequestById(odId);
    const fromStatus = odRequest.current_status;

    // Determine the required role based on the current status
    const statusRoleMap = {
      [OD_STATUS.PENDING_MENTOR]: "mentor",
      [OD_STATUS.PENDING_ADVISOR]: "advisor",
      [OD_STATUS.PENDING_COORDINATOR]: "coordinator",
      [OD_STATUS.PENDING_HOD]: "hod",
    };
    const actingRole = statusRoleMap[fromStatus];

    if (!actingRole || !facultyRoles.includes(actingRole)) {
      throw new Error(
        `Your role(s) (${facultyRoles.join(", ")}) cannot approve requests in '${fromStatus}' status.`,
      );
    }

    // Verify this faculty is assigned as the approver for this role
    const assignedApproverId = odRequest[`${actingRole}_id`];
    if (assignedApproverId && !facultyIds.includes(assignedApproverId)) {
      throw new Error("You are not assigned as the approver for this request.");
    }

    // Get next status
    const toStatus = getNextStatus(fromStatus);
    if (!toStatus) {
      throw new Error(
        `No next approval step configured for '${fromStatus}'. Contact admin.`,
      );
    }

    // Update OD request
    const updateData = { current_status: toStatus };
    if (actingRole === "hod") {
      updateData.final_decision = "granted";
    }

    const updatedOD = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.OD_REQUESTS,
      odId,
      updateData,
    );

    // If HOD granted, decrement OD counts
    if (actingRole === "hod") {
      // event_category contains the normalized category field name (e.g., "university", "nirf", etc.)
      // This will decrement both the category-specific count and the total od_count
      let categoryField = odRequest.event_category || null;
      
      if (!categoryField && odRequest.event_id) {
        try {
          const event = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, odRequest.event_id);
          const hostType = event?.host_type ? String(event.host_type).trim().toLowerCase() : "university";
          if (["iit_nit", "nirf", "industry", "others"].includes(hostType)) {
            categoryField = hostType;
          } else {
            categoryField = "university";
          }
        } catch (err) {
          secureLog.warn("Failed to fetch event to determine OD category", err);
        }
      }
      
      await decrementODCountAtomic(odRequest.student_id, categoryField);
      await decrementTeamODCountsAtomic(odRequest.team || [], categoryField);
    }

    // Log the approval
    await logApproval(
      odId,
      fromStatus,
      toStatus,
      "approve",
      userId,
      actingRole,
      remarks,
    );

    return { success: true, data: updatedOD };
  } catch (error) {
    secureLog.error("Error approving OD request:", error);
    return { success: false, error: error.message };
  }
}

export async function rejectODRequestSecure(odId, userId, remarks = "", userEmail = null) {
  try {
    if (!userId && !userEmail) throw new Error("User ID or Email is required");
    if (!remarks?.trim()) throw new Error("Rejection reason is required");

    const faculty = await getFacultyByAppwriteUserId(userId, userEmail);
    if (!faculty) {
      throw new Error("Faculty profile not found. Contact administrator.");
    }

    const facultyRoles = Array.isArray(faculty.role) ? faculty.role : [faculty.role];
    const facultyIds = [faculty.faculty_id, faculty.$id].filter(Boolean);

    // Get OD request
    const odRequest = await getODRequestById(odId);
    const fromStatus = odRequest.current_status;

    // Determine the required role based on the current status
    const statusRoleMap = {
      [OD_STATUS.PENDING_MENTOR]: "mentor",
      [OD_STATUS.PENDING_ADVISOR]: "advisor",
      [OD_STATUS.PENDING_COORDINATOR]: "coordinator",
      [OD_STATUS.PENDING_HOD]: "hod",
    };
    const actingRole = statusRoleMap[fromStatus];

    if (!actingRole || !facultyRoles.includes(actingRole)) {
      throw new Error(
        `Your role(s) (${facultyRoles.join(", ")}) cannot reject requests in '${fromStatus}' status.`,
      );
    }

    // Verify this faculty is assigned as the approver for this role
    const assignedApproverId = odRequest[`${actingRole}_id`];
    if (assignedApproverId && !facultyIds.includes(assignedApproverId)) {
      throw new Error("You are not assigned as the approver for this request.");
    }

    // Update OD request
    const updateData = {
      current_status: OD_STATUS.REJECTED,
      final_decision: "rejected",
    };

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
      actingRole,
      remarks,
    );

    return { success: true, data: updatedOD };
  } catch (error) {
    secureLog.error("Error rejecting OD request:", error);
    return { success: false, error: error.message };
  }
}
