"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getODRequestsByStatus, approveODRequest, rejectODRequest } from "@/lib/services/odRequestService";
import { Icons } from "@/components/layout";
import { OD_STATUS, canRoleApprove } from "@/lib/dbConfig";

const roleToStatus = {
    mentor: OD_STATUS.PENDING_MENTOR,
    advisor: OD_STATUS.PENDING_ADVISOR,
    coordinator: OD_STATUS.PENDING_COORDINATOR,
    hod: OD_STATUS.PENDING_HOD,
};

export default function ApprovalsPageContent({ role }) {
    const { user } = useAuth();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadPendingRequests();
    }, [role]);

    async function loadPendingRequests() {
        try {
            setLoading(true);
            const status = roleToStatus[role];

            if (!status) {
                // For roles like sudo/admin, show all pending
                setPendingRequests([]);
                return;
            }

            const response = await getODRequestsByStatus(status, 50);
            setPendingRequests(response?.documents || []);
        } catch (err) {
            console.error("Error loading pending requests:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(odId) {
        try {
            setActionLoading(odId);
            await approveODRequest(odId, role, user?.$id || user?.dbId, "Approved");
            await loadPendingRequests();
        } catch (err) {
            console.error("Error approving request:", err);
            alert("Failed to approve request");
        } finally {
            setActionLoading(null);
        }
    }

    async function handleReject(odId) {
        const remarks = prompt("Enter rejection reason:");
        if (!remarks) return;

        try {
            setActionLoading(odId);
            await rejectODRequest(odId, role, user?.$id || user?.dbId, remarks);
            await loadPendingRequests();
        } catch (err) {
            console.error("Error rejecting request:", err);
            alert("Failed to reject request");
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

    const canApprove = ["mentor", "advisor", "coordinator", "hod"].includes(role);

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#1E2761]">Pending Approvals</h1>
                <p className="text-gray-500 text-sm mt-1">
                    {canApprove
                        ? `Review and approve OD requests requiring ${role} approval`
                        : "View approval status of all requests"}
                </p>
            </div>

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
        </div>
    );
}
