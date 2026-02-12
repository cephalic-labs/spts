"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getStudentODRequests, getAllODRequests } from "@/lib/services/odRequestService";
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
};

const statusLabels = {
    [OD_STATUS.PENDING_MENTOR]: "Pending Mentor (Legacy)",
    [OD_STATUS.PENDING_ADVISOR]: "Pending Advisor",
    [OD_STATUS.PENDING_COORDINATOR]: "Pending Coordinator",
    [OD_STATUS.PENDING_HOD]: "Pending HOD",
    [OD_STATUS.GRANTED]: "Granted",
    [OD_STATUS.APPROVED]: "Approved",
    [OD_STATUS.REJECTED]: "Rejected",
};

export default function SubmissionsPageContent({ role }) {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedODId, setSelectedODId] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    useEffect(() => {
        if (user || role !== 'student') {
            loadSubmissions();
        }
    }, [role, user]);

    async function loadSubmissions() {
        try {
            setLoading(true);
            let response;

            if (role === "student") {
                // Students see their own submissions
                response = await getStudentODRequests(user?.$id || user?.dbId);
            } else {
                // Others see all submissions
                response = await getAllODRequests(100);
            }

            setSubmissions(response?.documents || []);
        } catch (err) {
            setError("Failed to load submissions");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const openDetails = (id) => {
        setSelectedODId(id);
        setIsDetailsModalOpen(true);
    };

    const canCreateSubmission = role === "student";

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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#1E2761]">Submissions</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {role === "student" ? "Your OD requests" : "All student submissions"}
                    </p>
                </div>
                {canCreateSubmission && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1E2761] text-white rounded-xl hover:bg-[#2d3a7d] transition-colors shadow-sm"
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

            {/* Submissions Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {submissions.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icons.Submissions />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-2">No Submissions Found</h3>
                        <p className="text-gray-500">
                            {role === "student" ? "Submit your first OD request." : "No submissions to display."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F8F9FA] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Event ID</th>
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
                                            {submission.event_id?.slice(0, 12)}...
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(submission.od_start_date).toLocaleDateString()} - {new Date(submission.od_end_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColors[submission.current_status] || "bg-gray-100 text-gray-600"}`}>
                                                {statusLabels[submission.current_status] || submission.current_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(submission.$createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openDetails(submission.$id)}
                                                className="text-[#1E2761] hover:underline text-xs font-black uppercase tracking-widest"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
