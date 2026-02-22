"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getODRequestsByStatus, approveODRequest, rejectODRequest } from "@/lib/services/odRequestService";
import { getFacultyByEmail, getFacultyByAppwriteId } from "@/lib/services/facultyService";
import { getEventById, getEventsByIds } from "@/lib/services/eventService";
import { getUserByAppwriteId } from "@/lib/services/userService";
import { getStudentByAppwriteUserId, getStudentById, getStudentByRollNo } from "@/lib/services/studentService";
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
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [approverFacultyId, setApproverFacultyId] = useState(null);
    const [approverError, setApproverError] = useState(null);
    const [errorModalMessage, setErrorModalMessage] = useState("");
    const [rejectDialog, setRejectDialog] = useState({ isOpen: false, odId: null, remarks: "" });
    const [rejectFormError, setRejectFormError] = useState("");


    // New State for View Request Modal
    const [viewRequest, setViewRequest] = useState(null);
    const [studentDetails, setStudentDetails] = useState(null);
    const [teamMembersData, setTeamMembersData] = useState([]);
    const [eventDetails, setEventDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [eventsMap, setEventsMap] = useState({});

    useEffect(() => {
        if (user) {
            loadPendingRequests();
        }
    }, [role, user?.$id]);

    // Fetch student and event details when viewRequest changes
    useEffect(() => {
        async function fetchDetails() {
            if (viewRequest) {
                setDetailsLoading(true);
                try {
                    // Fetch student details if not already present
                    if (!viewRequest.student && viewRequest.student_id) {
                        try {
                            // Try fetching by Appwrite User ID first
                            let student = await getStudentByAppwriteUserId(viewRequest.student_id);

                            // If not found, try fetching by Document ID
                            if (!student) {
                                try {
                                    student = await getStudentById(viewRequest.student_id);
                                } catch (innerErr) {
                                    // Quietly fail if not found by ID either
                                }
                            }

                            // LAST RESORT: Try fetching from Users collection to at least get the name
                            if (!student) {
                                try {
                                    const userRecord = await getUserByAppwriteId(viewRequest.student_id);
                                    if (userRecord) {
                                        student = {
                                            name: userRecord.user_name || "Unknown User",
                                            email: userRecord.user_email,
                                            department: "Profile Incomplete",
                                            section: "-",
                                            year: null,
                                            student_register_no: "Not Set"
                                        };
                                    }
                                } catch (userErr) {
                                    // Ignore
                                }
                            }

                            setStudentDetails(student);
                        } catch (err) {
                            console.error("Error fetching student details:", err);
                        }
                    } else if (viewRequest.student) {
                        setStudentDetails(viewRequest.student);
                    }

                    // Resolve team members
                    const teamRolls = viewRequest.team || [];
                    if (teamRolls.length > 0) {
                        const resolved = await Promise.all(
                            teamRolls.map(async (rollNo) => {
                                try {
                                    const member = await getStudentByRollNo(rollNo);
                                    return member || { roll_no: rollNo, name: rollNo };
                                } catch {
                                    return { roll_no: rollNo, name: rollNo };
                                }
                            })
                        );
                        setTeamMembersData(resolved);
                    } else {
                        setTeamMembersData([]);
                    }

                    // Fetch event details
                    if (viewRequest.event_id) {
                        try {
                            const event = await getEventById(viewRequest.event_id);
                            setEventDetails(event);
                        } catch (err) {
                            console.error("Error fetching event details:", err);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching details:", error);
                } finally {
                    setDetailsLoading(false);
                }
            }
        }

        if (viewRequest) {
            fetchDetails();
        } else {
            setStudentDetails(null);
            setEventDetails(null);
        }
    }, [viewRequest]);

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
            let requests = [];
            if (status && approverIds.length > 0) {
                const response = await getODRequestsByStatus(status, 50, {
                    approverRole: role,
                    approverIds: approverIds,
                });
                requests = response?.documents || [];
            } else if (status && !currentFacultyId) {
                // If not found as faculty, but has role (e.g. admin/sudo viewing as mentor), show all
                try {
                    const response = await getODRequestsByStatus(status, 50);
                    requests = response?.documents || [];
                } catch (e) {
                    requests = [];
                }
            }

            // Fetch Student Details for each request
            const enhancedRequests = await Promise.all(requests.map(async (req) => {
                try {
                    if (req.student_id) {
                        // Try fetching by Appwrite User ID first
                        let studentBody = await getStudentByAppwriteUserId(req.student_id);

                        // If not found, try fetching by Document ID
                        if (!studentBody) {
                            try {
                                studentBody = await getStudentById(req.student_id);
                            } catch (e) {
                                // Quietly fail if not found by ID either
                            }
                        }

                        // LAST RESORT: Try fetching from Users collection
                        if (!studentBody) {
                            try {
                                const userRecord = await getUserByAppwriteId(req.student_id);
                                if (userRecord) {
                                    studentBody = {
                                        name: userRecord.user_name || "Unknown User",
                                        email: userRecord.user_email,
                                        department: "Profile Incomplete",
                                        section: "-",
                                        year: null,
                                        student_register_no: "Not Set"
                                    };
                                }
                            } catch (e) {
                                // Ignore
                            }
                        }

                        return { ...req, student: studentBody };
                    }
                } catch (e) {
                    console.error("Error fetching student for req:", req.$id, e);
                }
                return req;
            }));

            setPendingRequests(enhancedRequests);

            // Fetch event details for pending requests to show event names in the list
            const eventIds = [...new Set(enhancedRequests.map(r => r.event_id).filter(Boolean))];
            if (eventIds.length > 0) {
                try {
                    const eventDocs = await getEventsByIds(eventIds);
                    const newEventsMap = {};
                    eventDocs.forEach(ev => {
                        newEventsMap[ev.$id] = ev;
                    });
                    setEventsMap(newEventsMap);
                } catch (e) {
                    console.error("Error fetching events for map:", e);
                }
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
            if (viewRequest && viewRequest.$id === odId) {
                setViewRequest(null);
            }
        } catch (err) {
            console.error("Error approving request:", err);
            setErrorModalMessage(err?.message || "Failed to approve request");
        } finally {
            setActionLoading(null);
        }
    }

    function openRejectDialog(odId) {
        setRejectFormError("");
        setRejectDialog({ isOpen: true, odId, remarks: "" });
    }

    function closeRejectDialog() {
        setRejectDialog({ isOpen: false, odId: null, remarks: "" });
        setRejectFormError("");
    }

    function closeViewDialog() {
        setViewRequest(null);
        setStudentDetails(null);
        setEventDetails(null);
    }

    async function submitReject() {
        const remarks = rejectDialog.remarks?.trim();
        if (!remarks) {
            setRejectFormError("Rejection reason is required.");
            return;
        }

        try {
            setActionLoading(rejectDialog.odId);
            await rejectODRequest(rejectDialog.odId, role, user?.$id || user?.dbId, remarks, approverFacultyId);
            await loadPendingRequests();
            closeRejectDialog();
            if (viewRequest && viewRequest.$id === rejectDialog.odId) {
                setViewRequest(null);
            }
        } catch (err) {
            console.error("Error rejecting request:", err);
            setErrorModalMessage(err?.message || "Failed to reject request");
        } finally {
            setActionLoading(null);
        }
    }



    function calculateDays(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
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



            {/* Pending Requests Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-12">
                {pendingRequests.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No pending requests to show.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Event & Dates</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pendingRequests.map((req) => (
                                    <tr key={req.$id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#1E2761] text-sm">{req.student?.name || "Unknown"}</span>
                                                <span className="text-xs text-gray-400 font-medium">
                                                    {req.student?.department} • {req.student?.year} Year
                                                    {req.team && req.team.length > 0 && (
                                                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold">
                                                            👥 +{req.team.length} team
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-700 text-sm">
                                                    {eventsMap[req.event_id]?.event_name || `Event: ${req.event_id?.slice(0, 8)}...`}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(req.od_start_date).toLocaleDateString()} - {new Date(req.od_end_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                {calculateDays(req.od_start_date, req.od_end_date)} Days
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setViewRequest(req)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => openRejectDialog(req.$id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Reject"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(req.$id)}
                                                    disabled={actionLoading === req.$id}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Approve"
                                                >
                                                    {actionLoading === req.$id ? (
                                                        <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>



            {/* View Details Modal */}
            {viewRequest && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 border border-gray-100 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-[#1E2761]">OD Request Details</h3>
                            <button onClick={closeViewDialog} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {detailsLoading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin w-8 h-8 border-4 border-[#1E2761] border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Student Info Section */}
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <h4 className="text-sm font-bold text-[#1E2761] uppercase tracking-wide mb-3 border-b border-blue-100 pb-2">Student Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Name</p>
                                            <p className="font-semibold text-gray-800">{studentDetails?.name || "Unknown"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Register No</p>
                                            <p className="font-semibold text-gray-800">{studentDetails?.student_register_no || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Department</p>
                                            <p className={`font-semibold ${studentDetails?.department === "Profile Incomplete" ? "text-red-500" : "text-gray-800"}`}>
                                                {studentDetails?.department || "-"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Year / Section</p>
                                            <p className="font-semibold text-gray-800">
                                                {studentDetails?.year ? `${studentDetails.year} Year` : "-"} / {studentDetails?.section || "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Event Details Section */}
                                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                                    <h4 className="text-sm font-bold text-[#1E2761] uppercase tracking-wide mb-3 border-b border-purple-100 pb-2">Event Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-gray-500 uppercase">Event Name</p>
                                            <p className="font-semibold text-gray-800">{eventDetails?.event_name || "Unknown Event"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Event Host</p>
                                            <p className="font-medium text-gray-800">{eventDetails?.event_host || "Unknown Host"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Event Date</p>
                                            <p className="font-medium text-gray-800">
                                                {eventDetails?.event_time
                                                    ? new Date(eventDetails.event_time).toDateString()
                                                    : "-"}
                                            </p>
                                        </div>
                                        {eventDetails?.event_url && (
                                            <div className="md:col-span-2">
                                                <a
                                                    href={eventDetails.event_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                                >
                                                    View Event Page
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Team Members Section */}
                                {teamMembersData.length > 0 && (
                                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                        <h4 className="text-sm font-bold text-[#1E2761] uppercase tracking-wide mb-3 border-b border-indigo-100 pb-2">👥 Team Members ({teamMembersData.length})</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {teamMembersData.map((member, idx) => (
                                                <div key={member.$id || idx} className="flex items-center gap-2 bg-white border border-indigo-100 rounded-lg px-3 py-2">
                                                    <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-black shrink-0">
                                                        {member.name?.charAt(0)?.toUpperCase() || "?"}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{member.name || member.roll_no}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium">
                                                            {member.roll_no}{member.department ? ` • ${member.department}` : ''}{member.year ? ` • ${member.year}Y` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Request Details Section */}
                                <div>
                                    <h4 className="text-sm font-bold text-[#1E2761] uppercase tracking-wide mb-3 border-b border-gray-100 pb-2">Request Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Start Date</p>
                                            <p className="font-medium text-gray-800">{new Date(viewRequest.od_start_date).toDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">End Date</p>
                                            <p className="font-medium text-gray-800">{new Date(viewRequest.od_end_date).toDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Duration</p>
                                            <p className="font-medium text-gray-800">
                                                {calculateDays(viewRequest.od_start_date, viewRequest.od_end_date)} Days
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Status</p>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                {viewRequest.current_status}
                                            </span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-gray-500 uppercase mb-1">Reason</p>
                                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                {viewRequest.reason || "No reason provided."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {viewRequest.attachments && viewRequest.attachments.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-[#1E2761] uppercase tracking-wide mb-3 border-b border-gray-100 pb-2">Attachments</h4>
                                        <div className="flex gap-2 flex-wrap">
                                            {viewRequest.attachments.map((att, idx) => (
                                                <a
                                                    key={idx}
                                                    href={att}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg max-w-xs hover:bg-gray-100 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                    </svg>
                                                    <span className="text-sm text-blue-600 truncate">Attachment {idx + 1}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={closeViewDialog}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                                    >
                                        Close
                                    </button>

                                    {canApprove && (
                                        <>
                                            <button
                                                onClick={() => openRejectDialog(viewRequest.$id)}
                                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprove(viewRequest.$id)}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                                            >
                                                Approve
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reject Dialog */}
            {rejectDialog.isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-gray-100 shadow-2xl">
                        <h3 className="text-lg font-black text-[#1E2761] mb-2">Reject OD Request</h3>
                        <p className="text-sm text-gray-600 mb-4">Provide a reason for rejection.</p>
                        <textarea
                            rows={4}
                            value={rejectDialog.remarks}
                            onChange={(e) => {
                                setRejectFormError("");
                                setRejectDialog((prev) => ({ ...prev, remarks: e.target.value }));
                            }}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20"
                            placeholder="Enter rejection reason..."
                        />
                        {rejectFormError && (
                            <p className="mt-2 text-xs text-red-600 font-semibold">{rejectFormError}</p>
                        )}
                        <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                            <button
                                onClick={closeRejectDialog}
                                disabled={Boolean(actionLoading)}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReject}
                                disabled={Boolean(actionLoading)}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading ? "Rejecting..." : "Reject Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message Modal */}
            {errorModalMessage && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 border border-gray-100 shadow-2xl">
                        <h3 className="text-lg font-black text-[#1E2761] mb-2">Action Failed</h3>
                        <p className="text-sm text-gray-600 mb-6">{errorModalMessage}</p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setErrorModalMessage("")}
                                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#1E2761] text-white font-semibold hover:bg-[#2d3a7d]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}
