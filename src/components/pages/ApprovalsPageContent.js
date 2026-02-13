"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getODRequestsByStatus, approveODRequest, rejectODRequest, getRecentApprovalLogs } from "@/lib/services/odRequestService";
import { getFacultyByEmail, getFacultyByAppwriteId } from "@/lib/services/facultyService";
import { getUserByAppwriteId } from "@/lib/services/userService";
import { Icons } from "@/components/layout";
import { OD_STATUS } from "@/lib/dbConfig";

const roleToStatus = {
    mentor: OD_STATUS.PENDING_MENTOR,
    advisor: OD_STATUS.PENDING_ADVISOR,
    coordinator: OD_STATUS.PENDING_COORDINATOR,
    hod: OD_STATUS.PENDING_HOD,
};

const roleSteps = {
    mentor: "Stage 1/4",
    advisor: "Stage 2/4",
    coordinator: "Stage 3/4",
    hod: "Stage 4/4",
};

function getLogActionMeta(action) {
    if (action === "approve") {
        return {
            label: "APPROVED",
            className: "bg-green-100 text-green-700",
        };
    }

    if (action === "cancel") {
        return {
            label: "CANCELLED",
            className: "bg-amber-100 text-amber-700",
        };
    }

    return {
        label: "REJECTED",
        className: "bg-red-100 text-red-700",
    };
}

export default function ApprovalsPageContent({ role }) {
    const { user } = useAuth();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [approverFacultyId, setApproverFacultyId] = useState(null);
    const [approverError, setApproverError] = useState(null);

    useEffect(() => {
        if (user) {
            loadPendingRequests();
        }
    }, [role, user?.$id]);

    async function loadPendingRequests() {
        try {
            setLoading(true);
            setApproverError(null);
            const status = roleToStatus[role];

            if (role === 'student') return; // Students don't approve

            let currentFacultyId = null;
            let approverIds = [];

            if (status && user?.$id) {
                // Try multiple methods to find the faculty record
                let faculty = null;

                // Method 1: Try by appwrite_user_id
                try {
                    faculty = await getFacultyByAppwriteId(user.$id);
                } catch (e) {
                    console.warn("Could not find faculty by Appwrite ID:", e);
                }

                // Method 2: Try by email if method 1 failed
                if (!faculty) {
                    const dbUser = await getUserByAppwriteId(user.$id);
                    const approverEmail = dbUser?.user_email || user?.email || null;
                    if (approverEmail) {
                        try {
                            faculty = await getFacultyByEmail(approverEmail);
                        } catch (e) {
                            console.warn("Could not find faculty by email:", e);
                        }
                    }
                }

                if (faculty) {
                    // Use both faculty_id (preferred) and $id (legacy) to catch all requests
                    approverIds = [faculty.faculty_id, faculty.$id].filter(Boolean);
                    setApproverFacultyId(approverIds);
                    currentFacultyId = faculty.$id;
                } else {
                    setApproverFacultyId(null);
                    setApproverError("Your faculty profile could not be found. Make sure your email matches a faculty record in the system.");
                }
            } else {
                setApproverFacultyId(null);
            }

            // Fetch pending requests
            if (status && approverIds.length > 0) {
                const response = await getODRequestsByStatus(status, 50, {
                    approverRole: role,
                    approverIds: approverIds,
                });
                setPendingRequests(response?.documents || []);
            } else if (status && !currentFacultyId) {
                // If not found as faculty, but has role (e.g. admin/sudo viewing as mentor), show all
                try {
                    const response = await getODRequestsByStatus(status, 50);
                    setPendingRequests(response?.documents || []);
                } catch (e) {
                    setPendingRequests([]);
                }
            } else {
                setPendingRequests([]);
            }

            // Fetch recent logs
            try {
                const logsResponse = await getRecentApprovalLogs(10);
                setRecentLogs(logsResponse?.documents || []);
            } catch (e) {
                setRecentLogs([]);
            }
        } catch (err) {
            console.error("Error loading pending requests:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(odId) {
        try {
            setActionLoading(odId);
            await approveODRequest(odId, role, user?.$id || user?.dbId, "Approved", approverFacultyId);
            await loadPendingRequests();
        } catch (err) {
            console.error("Error approving request:", err);
            alert(err?.message || "Failed to approve request");
        } finally {
            setActionLoading(null);
        }
    }

    async function handleReject(odId) {
        const remarks = prompt("Enter rejection reason:");
        if (!remarks) return;

        try {
            setActionLoading(odId);
            await rejectODRequest(odId, role, user?.$id || user?.dbId, remarks, approverFacultyId);
            await loadPendingRequests();
        } catch (err) {
            console.error("Error rejecting request:", err);
            alert(err?.message || "Failed to reject request");
        } finally {
            setActionLoading(null);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-[#1E2761] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (role === 'student') {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icons.Submissions className="w-10 h-10 text-[#1E2761]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E2761] mb-2">Track Your Approvals</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                    You can track the status of your OD requests in the Submissions section.
                </p>
                <a
                    href="/dashboard/student/submissions"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E2761] text-white font-bold rounded-xl hover:bg-[#2d3a7d] transition-colors"
                >
                    View My Submissions
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </a>
            </div>
        );
    }

    const canApprove = ["mentor", "advisor", "coordinator", "hod"].includes(role);

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#1E2761]">Pending Approvals</h1>
                <p className="text-gray-500 text-sm mt-1">
                    {canApprove
                        ? `Review and approve requests (${roleSteps[role] || "Unknown Stage"})`
                        : "View approval status of all requests"}
                </p>
            </div>

            {/* Approver Error Banner */}
            {approverError && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Faculty Profile Issue</p>
                    <p className="text-xs text-amber-700">{approverError}</p>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="text-3xl font-bold text-[#1E2761]">{pendingRequests.length}</div>
                    <div className="text-sm text-gray-500">Pending Your Review</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="text-3xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-500">Approved Today</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="text-3xl font-bold text-red-600">0</div>
                    <div className="text-sm text-gray-500">Rejected Today</div>
                </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {pendingRequests.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-2">All Caught Up!</h3>
                        <p className="text-gray-500">No pending requests requiring your approval.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {pendingRequests.map((request) => (
                            <div key={request.$id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-mono text-sm text-gray-400">
                                                #{request.od_id?.slice(0, 8) || request.$id.slice(0, 8)}
                                            </span>
                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">
                                                Pending
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 mb-1">
                                            OD Request - Student: {request.student_id?.slice(0, 12)}...
                                        </h4>
                                        <p className="text-sm text-gray-500 mb-2">{request.reason}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span>
                                                📅 {new Date(request.od_start_date).toLocaleDateString()} - {new Date(request.od_end_date).toLocaleDateString()}
                                            </span>
                                            <span>
                                                🕐 Requested {new Date(request.$createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {canApprove && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleReject(request.$id)}
                                                disabled={actionLoading === request.$id}
                                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprove(request.$id)}
                                                disabled={actionLoading === request.$id}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === request.$id ? "..." : "Approve"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Activity Section */}
            <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-[#1E2761]">Recent Approval Activity</h2>
                        <p className="text-gray-500 text-sm">Review recent actions taken on OD requests</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {recentLogs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No recent activity found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Log ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">OD ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Action By</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {recentLogs.map((log) => (
                                        <tr key={log.$id} className="hover:bg-gray-50 transition-colors text-sm">
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(log.action_at).toLocaleString([], {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs text-gray-400">
                                                    #{log.log_id?.slice(0, 8) || log.$id.slice(0, 8)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs text-blue-600">
                                                    #{log.od_id?.slice(0, 8)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-700 capitalize">{log.action_by_role}</span>
                                                    <span className="text-xs text-gray-400">({log.action_by_user_id?.slice(0, 8)})</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${getLogActionMeta(log.action).className}`}>
                                                    {getLogActionMeta(log.action).label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 italic">
                                                {log.remarks || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
