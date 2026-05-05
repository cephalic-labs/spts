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

async function getFacultyByAppwriteUserId(userId) {
  if (!userId) return null;

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.FACULTIES,
      [Query.equal("appwrite_user_id", userId), Query.limit(1)],
    );
    return response.documents[0] || null;
  } catch (error) {
    secureLog.error("Error fetching faculty by user ID:", error);
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

export async function approveODRequestSecure(odId, userId, remarks = "") {
  try {
    if (!userId) throw new Error("User ID is required");

    const faculty = await getFacultyByAppwriteUserId(userId);
    if (!faculty) {
      throw new Error("Faculty profile not found. Contact administrator.");
    }

    const role = faculty.role;
    const facultyIds = [faculty.faculty_id, faculty.$id].filter(Boolean);

    // Get OD request
    const odRequest = await getODRequestById(odId);
    const fromStatus = odRequest.current_status;

    // Verify role can approve this status
    if (!canRoleApprove(role, fromStatus)) {
      throw new Error(
        `Your role (${role}) cannot approve requests in '${fromStatus}' status.`,
      );
    }

    // Verify this faculty is assigned as the approver for this role
    const assignedApproverId = odRequest[`${role}_id`];
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
    if (role === "hod") {
      updateData.final_decision = "granted";
    }

    const updatedOD = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.OD_REQUESTS,
      odId,
      updateData,
    );

    // If HOD granted, decrement OD counts
    if (role === "hod") {
      const categoryField =
        odRequest.event_category || odRequest.event_host_type || null;
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
      role,
      remarks,
    );

    return { success: true, data: updatedOD };
  } catch (error) {
    secureLog.error("Error approving OD request:", error);
    return { success: false, error: error.message };
  }
}

export async function rejectODRequestSecure(odId, userId, remarks = "") {
  try {
    if (!userId) throw new Error("User ID is required");
    if (!remarks?.trim()) throw new Error("Rejection reason is required");

    const faculty = await getFacultyByAppwriteUserId(userId);
    if (!faculty) {
      throw new Error("Faculty profile not found. Contact administrator.");
    }

    const role = faculty.role;
    const facultyIds = [faculty.faculty_id, faculty.$id].filter(Boolean);

    // Get OD request
    const odRequest = await getODRequestById(odId);
    const fromStatus = odRequest.current_status;

    // Verify role can reject this status
    if (!canRoleApprove(role, fromStatus)) {
      throw new Error(
        `Your role (${role}) cannot reject requests in '${fromStatus}' status.`,
      );
    }

    // Verify this faculty is assigned as the approver for this role
    const assignedApproverId = odRequest[`${role}_id`];
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
      role,
      remarks,
    );

    return { success: true, data: updatedOD };
  } catch (error) {
    secureLog.error("Error rejecting OD request:", error);
    return { success: false, error: error.message };
  }
}
