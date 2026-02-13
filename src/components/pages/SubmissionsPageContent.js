"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getStudentODRequests, getAllODRequests, cancelODRequest } from "@/lib/services/odRequestService";
import { getEventsByIds } from "@/lib/services/eventService";
import { Icons } from "@/components/layout";
import { OD_STATUS } from "@/lib/dbConfig";
import CreateODModal from "./CreateODModal";
import ODDetailsModal from "./ODDetailsModal";

const statusColors = {
    [OD_STATUS.PENDING_MENTOR]: "bg-yellow-100 text-yellow-700",
    [OD_STATUS.PENDING_ADVISOR]: "bg-yellow-100 text-yellow-700",
    [OD_STATUS.PENDING_COORDINATOR]: "bg-orange-100 text-orange-700",
    [OD_STATUS.PENDING_HOD]: "bg-blue-100 text-blue-700",
    [OD_STATUS.GRANTED]: "bg-green-100 text-green-700",
    [OD_STATUS.APPROVED]: "bg-green-100 text-green-700",
    [OD_STATUS.REJECTED]: "bg-red-100 text-red-700",
    [OD_STATUS.CANCELLED]: "bg-gray-100 text-gray-700",
};

const statusLabels = {
    [OD_STATUS.PENDING_MENTOR]: "Pending Mentor",
    [OD_STATUS.PENDING_ADVISOR]: "Pending Advisor",
    [OD_STATUS.PENDING_COORDINATOR]: "Pending Coordinator",
    [OD_STATUS.PENDING_HOD]: "Pending HOD",
    [OD_STATUS.GRANTED]: "Granted",
    [OD_STATUS.APPROVED]: "Approved",
    [OD_STATUS.REJECTED]: "Rejected",
    [OD_STATUS.CANCELLED]: "Cancelled",
};

export default function SubmissionsPageContent({ role }) {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [eventsMap, setEventsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedODId, setSelectedODId] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [cancelLoadingId, setCancelLoadingId] = useState(null);
    const [cancelDialogSubmission, setCancelDialogSubmission] = useState(null);

    useEffect(() => {
        if (user || role !== 'student') {
            loadSubmissions();
        }
    }, [role, user?.$id]);

    async function loadSubmissions() {
        try {
            setLoading(true);
            setError(null);
            let response;

            if (role === "student") {
                const studentId = user?.$id;
                if (!studentId) {
                    setSubmissions([]);
                    return;
                }
                // Students see their own submissions
                response = await getStudentODRequests(studentId);
            } else {
                // Others see all submissions
                response = await getAllODRequests(100);
            }

            const docs = response?.documents || [];
            setSubmissions(docs);

            // Fetch event details
            const eventIds = [...new Set(docs.map(s => s.event_id).filter(Boolean))];
            if (eventIds.length > 0) {
                const events = await getEventsByIds(eventIds);
                const map = {};
                events.forEach(e => {
                    map[e.$id] = e;
                });
                setEventsMap(map);
            }
        } catch (err) {
            setError("Failed to load submissions. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const openDetails = (id) => {
        setSelectedODId(id);
        setIsDetailsModalOpen(true);
    };

    function openCancelDialog(submission) {
        setCancelDialogSubmission(submission);
    }

    function closeCancelDialog() {
        if (cancelLoadingId) return;
        setCancelDialogSubmission(null);
    }

    async function confirmCancel() {
        const submission = cancelDialogSubmission;
        if (!submission) return;

        const studentId = user?.$id || user?.dbId;
        if (!studentId) {
            setError("Unable to identify your account. Please sign in again.");
            return;
        }

        const canCancel = submission.current_status?.startsWith("pending_");
        if (!canCancel) return;

        try {
            setCancelLoadingId(submission.$id);
            setError(null);
            await cancelODRequest(submission.$id, studentId, "Cancelled by student");
            await loadSubmissions();
            setCancelDialogSubmission(null);
        } catch (err) {
            console.error("Error cancelling OD request:", err);
            setError(err?.message || "Failed to cancel request. Please try again.");
        } finally {
            setCancelLoadingId(null);
        }
    }

    const canCreateSubmission = role === "student";

    function getEventName(submission) {
        return eventsMap[submission.event_id]?.event_name || `${submission.event_id?.slice(0, 12)}...`;
    }

    function formatShortDate(value) {
        if (!value) return "N/A";
        return new Date(value).toLocaleDateString();
    }

    if (loading && submissions.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-[#1E2761] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#1E2761]">Submissions</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {role === "student" ? "Your OD requests" : "All student submissions"}
                    </p>
                </div>
                {canCreateSubmission && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E2761] text-white rounded-xl hover:bg-[#2d3a7d] transition-colors shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Request
                    </button>
                )}
            </div>

            <CreateODModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadSubmissions}
            />

            <ODDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                odId={selectedODId}
            />

            {/* Error Banner */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-red-700">{error}</p>
                    <button
                        onClick={loadSubmissions}
                        className="text-xs font-bold text-red-600 hover:text-red-800 underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Submissions Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {submissions.length === 0 && !error ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icons.Submissions />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-2">No Submissions Found</h3>
                        <p className="text-gray-500">
                            {role === "student" ? "Submit your first OD request using the 'New Request' button above." : "No submissions to display."}
                        </p>
                    </div>
                ) : submissions.length > 0 ? (
                    <>
                        <div className="md:hidden p-3 space-y-3">
                            {submissions.map((submission) => (
                                <div key={submission.$id} className="border border-gray-100 rounded-xl p-4 bg-white">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <p className="text-xs font-mono text-gray-400">
                                            #{submission.od_id?.slice(0, 8) || submission.$id.slice(0, 8)}
                                        </p>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColors[submission.current_status] || "bg-gray-100 text-gray-600"}`}>
                                            {statusLabels[submission.current_status] || submission.current_status}
                                        </span>
                                    </div>

                                    <p className="text-sm font-bold text-[#1E2761] mb-2 line-clamp-2">{getEventName(submission)}</p>

                                    <div className="space-y-1.5 text-xs text-gray-500">
                                        <p>
                                            <span className="font-semibold text-gray-600">Date:</span>{" "}
                                            {formatShortDate(submission.od_start_date)} - {formatShortDate(submission.od_end_date)}
                                        </p>
                                        <p>
                                            <span className="font-semibold text-gray-600">Created:</span>{" "}
                                            {formatShortDate(submission.$createdAt)}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex items-center justify-end gap-3">
                                        {role === "student" && submission.current_status?.startsWith("pending_") && (
                                            <button
                                                onClick={() => openCancelDialog(submission)}
                                                disabled={cancelLoadingId === submission.$id}
                                                className="text-red-600 hover:text-red-800 hover:underline text-xs font-black uppercase tracking-widest disabled:opacity-50"
                                            >
                                                {cancelLoadingId === submission.$id ? "Cancelling..." : "Cancel"}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openDetails(submission.$id)}
                                            className="text-[#1E2761] hover:underline text-xs font-black uppercase tracking-widest"
                                        >
                                            Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full min-w-[860px]">
                                <thead className="bg-[#F8F9FA] border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Event</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Range</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {submissions.map((submission) => (
                                        <tr key={submission.$id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-gray-400">
                                                #{submission.od_id?.slice(0, 8) || submission.$id.slice(0, 8)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                                                {getEventName(submission)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatShortDate(submission.od_start_date)} - {formatShortDate(submission.od_end_date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColors[submission.current_status] || "bg-gray-100 text-gray-600"}`}>
                                                    {statusLabels[submission.current_status] || submission.current_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                {formatShortDate(submission.$createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {role === "student" && submission.current_status?.startsWith("pending_") && (
                                                        <button
                                                            onClick={() => openCancelDialog(submission)}
                                                            disabled={cancelLoadingId === submission.$id}
                                                            className="text-red-600 hover:text-red-800 hover:underline text-xs font-black uppercase tracking-widest disabled:opacity-50"
                                                        >
                                                            {cancelLoadingId === submission.$id ? "Cancelling..." : "Cancel"}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openDetails(submission.$id)}
                                                        className="text-[#1E2761] hover:underline text-xs font-black uppercase tracking-widest"
                                                    >
                                                        Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : null}
            </div>

            {cancelDialogSubmission && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-gray-100 shadow-2xl">
                        <h3 className="text-lg font-black text-[#1E2761] mb-2">Cancel OD Request?</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            This action cannot be undone. The request will move to cancelled status.
                        </p>
                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                            <button
                                onClick={closeCancelDialog}
                                disabled={Boolean(cancelLoadingId)}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
                            >
                                Keep Request
                            </button>
                            <button
                                onClick={confirmCancel}
                                disabled={Boolean(cancelLoadingId)}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                                {cancelLoadingId ? "Cancelling..." : "Yes, Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
