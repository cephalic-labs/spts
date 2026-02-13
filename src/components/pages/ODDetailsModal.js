"use client";

import { useState, useEffect } from "react";
import { getODRequestById, getApprovalLogsByODId } from "@/lib/services/odRequestService";
import { getEventById } from "@/lib/services/eventService";
import { getStudentByAppwriteUserId, getStudentByEmail } from "@/lib/services/studentService";
import { getFacultyById, getFacultyByFacultyId } from "@/lib/services/facultyService";
import { getUserByAppwriteId } from "@/lib/services/userService";
import { OD_STATUS } from "@/lib/dbConfig";

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

// The 4-step approval pipeline
const APPROVAL_STEPS = [
    { key: "mentor", label: "Mentor", statusField: "mentor_status", remarksField: "mentor_remarks", actionAtField: "mentor_action_at", pendingStatus: OD_STATUS.PENDING_MENTOR },
    { key: "advisor", label: "Advisor", statusField: "advisor_status", remarksField: "advisor_remarks", actionAtField: "advisor_action_at", pendingStatus: OD_STATUS.PENDING_ADVISOR },
    { key: "coordinator", label: "Coordinator", statusField: "coordinator_status", remarksField: "coordinator_remarks", actionAtField: "coordinator_action_at", pendingStatus: OD_STATUS.PENDING_COORDINATOR },
    { key: "hod", label: "HOD", statusField: "hod_status", remarksField: "hod_remarks", actionAtField: "hod_action_at", pendingStatus: OD_STATUS.PENDING_HOD },
];

// Pipeline order definition
const PIPELINE_ORDER = [
    OD_STATUS.PENDING_MENTOR,
    OD_STATUS.PENDING_ADVISOR,
    OD_STATUS.PENDING_COORDINATOR,
    OD_STATUS.PENDING_HOD,
    OD_STATUS.GRANTED,
    OD_STATUS.APPROVED
];

function getStepState(odRequest, step) {
    if (!odRequest) return "waiting";

    // 1. Check explicit status if available
    const stepStatus = odRequest[step.statusField];
    if (stepStatus === "approved") return "approved";
    if (stepStatus === "rejected") return "rejected";

    // 2. Check current status match
    if (odRequest.current_status === step.pendingStatus) return "current";

    // 3. Infer "approved" based on pipeline position
    // If request status is later in the pipeline than this step's pending status, 
    // we can assume this step was approved.
    const currentIndex = PIPELINE_ORDER.indexOf(odRequest.current_status);
    const stepIndex = PIPELINE_ORDER.indexOf(step.pendingStatus);

    if (currentIndex > stepIndex) return "approved";

    // 4. Handle Rejected case slightly differently?
    // If rejected, we typically reset or just show the rejection banner.
    // The individual step circles will stay "waiting" unless explicitly marked rejected.

    return "waiting";
}

function getLogActionMeta(action) {
    if (action === "approve") {
        return {
            label: "Approved",
            iconClass: "bg-green-100 text-green-600",
            badgeClass: "text-green-600",
        };
    }

    if (action === "cancel") {
        return {
            label: "Cancelled",
            iconClass: "bg-amber-100 text-amber-700",
            badgeClass: "text-amber-700",
        };
    }

    return {
        label: "Rejected",
        iconClass: "bg-red-100 text-red-600",
        badgeClass: "text-red-600",
    };
}

export default function ODDetailsModal({ isOpen, onClose, odId }) {
    const [odRequest, setOdRequest] = useState(null);
    const [logs, setLogs] = useState([]);
    const [eventDetails, setEventDetails] = useState(null);
    const [studentDetails, setStudentDetails] = useState(null);
    const [submitterEmail, setSubmitterEmail] = useState("");
    const [advisorName, setAdvisorName] = useState("N/A");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && odId) {
            loadDetails();
        }
    }, [isOpen, odId]);

    async function loadDetails() {
        try {
            setLoading(true);
            const data = await getODRequestById(odId);
            setOdRequest(data);

            // Prefer querying sece-students by submitter email (more reliable than appwrite_user_id in some setups).
            const resolveSubmitterEmail = async (odRequestData) => {
                if (!odRequestData) return "";
                if (odRequestData.student_email && odRequestData.student_email.includes("@")) {
                    return odRequestData.student_email;
                }
                if (odRequestData.student_id && odRequestData.student_id.includes("@")) {
                    return odRequestData.student_id;
                }
                if (!odRequestData.student_id) return "";

                const dbUser = await getUserByAppwriteId(odRequestData.student_id).catch(() => null);
                return dbUser?.user_email || "";
            };

            const resolvedEmail = await resolveSubmitterEmail(data);
            setSubmitterEmail(resolvedEmail || "");

            let studentData = null;
            if (resolvedEmail) {
                studentData = await getStudentByEmail(resolvedEmail).catch(() => null);
            }
            if (!studentData && data.student_id) {
                studentData = await getStudentByAppwriteUserId(data.student_id).catch(() => null);
            }

            const [logsData, eventData] = await Promise.all([
                getApprovalLogsByODId(odId),
                data.event_id ? getEventById(data.event_id).catch(() => null) : Promise.resolve(null),
            ]);

            let resolvedAdvisorName = "N/A";
            if (studentData?.advisor_id) {
                const advisorByDocId = await getFacultyById(studentData.advisor_id).catch(() => null);
                const advisorByFacultyId = advisorByDocId ? null : await getFacultyByFacultyId(studentData.advisor_id).catch(() => null);
                resolvedAdvisorName = advisorByDocId?.name || advisorByFacultyId?.name || studentData.advisor_id;
            }

            setLogs(logsData.documents || []);
            setEventDetails(eventData);
            setStudentDetails(studentData);
            setAdvisorName(resolvedAdvisorName);
        } catch (error) {
            console.error("Error loading OD details:", error);
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    const isGranted = odRequest?.current_status === OD_STATUS.GRANTED || odRequest?.current_status === OD_STATUS.APPROVED;
    const isRejected = odRequest?.current_status === OD_STATUS.REJECTED;
    const isCancelled = odRequest?.current_status === OD_STATUS.CANCELLED;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-4 sm:p-8 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-[#1E2761]">OD Request Details</h2>
                        <p className="text-gray-400 text-sm font-medium">#{odId?.slice(0, 8)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 sm:p-8 max-h-[calc(90vh-130px)] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-[#1E2761] border-t-transparent rounded-full"></div>
                        </div>
                    ) : odRequest ? (
                        <div className="space-y-8">
                            {/* Final Status Banner */}
                            {isGranted && (
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-black text-green-700 mb-1">OD Granted! 🎉</h3>
                                    <p className="text-green-600 text-sm">Your OD request has been approved by all approvers.</p>
                                </div>
                            )}
                            {isRejected && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-black text-red-700 mb-1">OD Rejected</h3>
                                    <p className="text-red-600 text-sm">Your OD request was rejected. See details below.</p>
                                </div>
                            )}
                            {isCancelled && (
                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6l-12 12" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-700 mb-1">OD Cancelled</h3>
                                    <p className="text-gray-600 text-sm">This OD request was cancelled by the student.</p>
                                </div>
                            )}

                            {/* Approval Progress Tracker */}
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Approval Progress</h4>
                                <div className="overflow-x-auto">
                                    <div className="relative min-w-[520px]">
                                    {/* Progress line */}
                                    <div className="absolute top-5 left-5 right-5 h-[2px] bg-gray-200 z-0"></div>
                                    <div className="relative flex justify-between z-10">
                                        {APPROVAL_STEPS.map((step, idx) => {
                                            const state = getStepState(odRequest, step);
                                            const actionAt = odRequest[step.actionAtField];
                                            const remarks = odRequest[step.remarksField];

                                            return (
                                                <div key={step.key} className="flex flex-col items-center" style={{ width: '25%' }}>
                                                    {/* Circle */}
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${state === "approved"
                                                        ? "bg-green-500 border-green-500 text-white"
                                                        : state === "rejected"
                                                            ? "bg-red-500 border-red-500 text-white"
                                                            : state === "current"
                                                                ? "bg-white border-[#1E2761] text-[#1E2761] animate-pulse shadow-lg shadow-[#1E2761]/20"
                                                                : "bg-gray-100 border-gray-200 text-gray-400"
                                                        }`}>
                                                        {state === "approved" ? (
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                            </svg>
                                                        ) : state === "rejected" ? (
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                                                            </svg>
                                                        ) : (
                                                            <span className="text-xs font-black">{idx + 1}</span>
                                                        )}
                                                    </div>
                                                    {/* Label */}
                                                    <span className={`mt-2 text-xs font-bold text-center ${state === "approved" ? "text-green-600"
                                                        : state === "rejected" ? "text-red-600"
                                                            : state === "current" ? "text-[#1E2761]"
                                                                : "text-gray-400"
                                                        }`}>
                                                        {step.label}
                                                    </span>
                                                    {/* Status text */}
                                                    <span className={`text-[10px] mt-0.5 ${state === "approved" ? "text-green-500"
                                                        : state === "rejected" ? "text-red-500"
                                                            : state === "current" ? "text-yellow-600"
                                                                : "text-gray-300"
                                                        }`}>
                                                        {state === "approved" ? "Approved"
                                                            : state === "rejected" ? "Rejected"
                                                                : state === "current" ? "Awaiting..."
                                                                    : "Pending"}
                                                    </span>
                                                    {/* Timestamp */}
                                                    {actionAt && (
                                                        <span className="text-[9px] text-gray-400 mt-0.5">
                                                            {new Date(actionAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Final granted step */}
                                    {isGranted && (
                                        <div className="mt-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase tracking-wider">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                </svg>
                                                OD Granted
                                            </span>
                                        </div>
                                    )}
                                    </div>
                                </div>
                            </div>

                            {/* Student Details */}
                            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Student Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Student Name</p>
                                        <p className="text-sm font-bold text-[#1E2761]">{studentDetails?.name || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Roll Number</p>
                                        <p className="text-sm font-bold text-[#1E2761]">
                                            {studentDetails?.roll_no || studentDetails?.student_register_no || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Email</p>
                                        <p className="text-sm font-bold text-[#1E2761] break-all">
                                            {studentDetails?.email || submitterEmail || (odRequest?.student_id?.includes("@") ? odRequest.student_id : "N/A")}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Year</p>
                                        <p className="text-sm font-bold text-[#1E2761]">{studentDetails?.year ?? "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Section</p>
                                        <p className="text-sm font-bold text-[#1E2761]">{studentDetails?.section || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Advisor</p>
                                        <p className="text-sm font-bold text-[#1E2761]">{advisorName || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Event</h4>
                                    <p className="font-bold text-[#1E2761]">{eventDetails?.event_name || odRequest.event_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Duration</h4>
                                    <p className="font-bold text-[#1E2761]">
                                        {new Date(odRequest.od_start_date).toLocaleDateString()} - {new Date(odRequest.od_end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Reason</h4>
                                    <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{odRequest.reason}</p>
                                </div>
                            </div>

                            {/* Approval Timeline */}
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Approval Timeline</h4>
                                <div className="space-y-6">
                                    {logs.length === 0 ? (
                                        <p className="text-gray-400 italic text-sm">No activity recorded yet. Waiting for mentor approval.</p>
                                    ) : (
                                        logs.map((log, idx) => (
                                            <div key={log.$id} className="relative flex gap-4">
                                                {idx !== logs.length - 1 && (
                                                    <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-gray-100"></div>
                                                )}
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${getLogActionMeta(log.action).iconClass}`}>
                                                    {log.action === 'approve' ? (
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                                    ) : log.action === 'cancel' ? (
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" /></svg>
                                                    ) : (
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-sm text-[#1E2761] capitalize">{log.action_by_role}</span>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${getLogActionMeta(log.action).badgeClass}`}>
                                                            {getLogActionMeta(log.action).label}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-1">{log.remarks || 'No remarks'}</p>
                                                    <div className="text-[10px] text-gray-400 font-medium">
                                                        {new Date(log.action_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            Failed to load OD request data.
                        </div>
                    )}
                </div>

                <div className="p-4 sm:p-8 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-[#1E2761] text-white font-bold rounded-xl hover:bg-[#2d3a7d] transition-all active:scale-95"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
