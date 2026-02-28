"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getEvents } from "@/lib/services/eventService";
import { getStudentEventParticipations, PARTICIPATION_STATUS } from "@/lib/services/eventParticipationService";
import { createODRequest, getStudentODRequests } from "@/lib/services/odRequestService";
import { getStudentByAppwriteUserId, getStudentByEmail, searchStudentsByRollNo } from "@/lib/services/studentService";
import { getFaculties } from "@/lib/services/facultyService";
import { OD_STATUS } from "@/lib/dbConfig";

function normalizeDateOnly(value) {
    if (!value) return "";

    if (typeof value === "string") {
        const matchedDate = value.match(/^(\d{4}-\d{2}-\d{2})/);
        if (matchedDate) {
            return matchedDate[1];
        }
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return "";

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function CreateODModal({ isOpen, onClose, onSuccess }) {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingEvents, setFetchingEvents] = useState(false);
    const [fetchingParticipation, setFetchingParticipation] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [studentDataLoading, setStudentDataLoading] = useState(false);
    const [participatedEventIds, setParticipatedEventIds] = useState(new Set());
    const [mentors, setMentors] = useState([]);
    const [fetchingMentors, setFetchingMentors] = useState(false);
    const [formError, setFormError] = useState("");
    const [pendingEventsRequest, setPendingEventsRequest] = useState(new Set());

    // Team feature states
    const [isTeamRequest, setIsTeamRequest] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]); // Array of student objects
    const [teamSearchQuery, setTeamSearchQuery] = useState("");
    const [teamSearchResults, setTeamSearchResults] = useState([]);
    const [teamSearching, setTeamSearching] = useState(false);
    const [teamSearchFocused, setTeamSearchFocused] = useState(false);

    const [formData, setFormData] = useState({
        event_id: "",
        od_start_date: "",
        od_end_date: "",
        reason: "",
        mentor_id: "",
    });

    useEffect(() => {
        if (isOpen) {
            setFormError("");
            setIsTeamRequest(false);
            setTeamMembers([]);
            setTeamSearchQuery("");
            setTeamSearchResults([]);
            loadEvents();
            loadStudentInfo();
            loadParticipationInfo();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && user?.$id) {
            loadPendingODRequests(user?.$id, studentData?.roll_no);
        }
    }, [isOpen, user?.$id, studentData]);

    // Debounced team search
    useEffect(() => {
        if (!teamSearchQuery || teamSearchQuery.trim().length < 2) {
            setTeamSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setTeamSearching(true);
            try {
                const results = await searchStudentsByRollNo(teamSearchQuery.trim(), 8);
                // Filter out the current student and already-added team members
                const existingIds = new Set(teamMembers.map(m => m.$id));
                const filtered = results.filter(s => {
                    if (studentData && s.$id === studentData.$id) return false;
                    if (existingIds.has(s.$id)) return false;
                    // Only show students with available OD count
                    const mCount = s.od_count !== undefined && s.od_count !== null ? s.od_count : 7;
                    if (mCount <= 0) return false;
                    return true;
                });
                setTeamSearchResults(filtered);
            } catch (err) {
                console.error("Team search error:", err);
                setTeamSearchResults([]);
            } finally {
                setTeamSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [teamSearchQuery, teamMembers, studentData]);

    async function loadEvents() {
        try {
            setFetchingEvents(true);
            const response = await getEvents(100);
            setEvents(response.documents || []);
        } catch (error) {
            console.error("Error loading events:", error);
        } finally {
            setFetchingEvents(false);
        }
    }

    async function loadStudentInfo() {
        try {
            if (!user) return;

            setStudentDataLoading(true);
            let student = null;

            if (user.email) {
                try {
                    student = await getStudentByEmail(user.email);
                } catch (e) {
                    console.warn("Could not fetch student by email:", e);
                }
            }
            if (!student && user.$id) {
                try {
                    student = await getStudentByAppwriteUserId(user.$id);
                } catch (e) {
                    console.warn("Could not fetch student by Appwrite ID:", e);
                }
            }

            setStudentData(student);

            if (student) {
                // Pre-fill mentor if available in student profile
                if (student.mentor_id) {
                    setFormData(prev => ({ ...prev, mentor_id: student.mentor_id }));
                }

                // Fetch potential mentors AND advisors (faculty in same department)
                setFetchingMentors(true);
                try {
                    const results = await Promise.allSettled([
                        getFaculties({ department: student.department, role: "mentor" }),
                        getFaculties({ department: student.department, role: "advisor" })
                    ]);

                    const combined = [];
                    for (const result of results) {
                        if (result.status === "fulfilled") {
                            combined.push(...(result.value.documents || []));
                        }
                    }

                    // Filters duplicates based on $id
                    const uniqueFaculty = Array.from(new Map(combined.map(item => [item.$id, item])).values());
                    setMentors(uniqueFaculty);

                    // Ensure form uses $id even if student profile has faculty_id (legacy)
                    if (student.mentor_id) {
                        const assignedMentor = uniqueFaculty.find(f => f.faculty_id === student.mentor_id || f.$id === student.mentor_id);
                        if (assignedMentor) {
                            setFormData(prev => ({ ...prev, mentor_id: assignedMentor.$id }));
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch faculty:", err);
                    setMentors([]);
                } finally {
                    setFetchingMentors(false);
                }
            }
        } catch (error) {
            console.error("Error loading student info:", error);
        } finally {
            setStudentDataLoading(false);
        }
    }

    async function loadParticipationInfo() {
        if (!user?.$id) return;

        try {
            setFetchingParticipation(true);
            const response = await getStudentEventParticipations(user.$id);
            const participatedIds = new Set(
                (response.documents || [])
                    .filter((item) => item.status === PARTICIPATION_STATUS.PARTICIPATED)
                    .map((item) => item.event_id)
            );
            setParticipatedEventIds(participatedIds);
        } catch (error) {
            console.error("Error loading participation info:", error);
        } finally {
            setFetchingParticipation(false);
        }
    }

    async function loadPendingODRequests(studentId, rollNo) {
        if (!studentId) return;

        try {
            const response = await getStudentODRequests(studentId, 100, rollNo);
            const pendingIds = new Set(
                (response.documents || [])
                    .filter((od) => {
                        const s = od.current_status;
                        return s && (s.startsWith("pending_") || s === OD_STATUS.GRANTED || s === OD_STATUS.APPROVED);
                    })
                    .map((od) => od.event_id)
            );
            setPendingEventsRequest(pendingIds);
        } catch (error) {
            console.error("Error loading pending OD requests:", error);
        }
    }

    function addTeamMember(student) {
        setTeamMembers(prev => [...prev, student]);
        setTeamSearchQuery("");
        setTeamSearchResults([]);
    }

    function removeTeamMember(studentId) {
        setTeamMembers(prev => prev.filter(m => m.$id !== studentId));
    }

    const selectedEvent = events.find((event) => event.$id === formData.event_id) || null;
    const selectedEventDate = normalizeDateOnly(selectedEvent?.event_time);
    const participatedEvents = events.filter((event) =>
        participatedEventIds.has(event.$id) && !pendingEventsRequest.has(event.$id)
    );
    const isDataLoading = studentDataLoading || fetchingEvents || fetchingParticipation;
    const odCount = studentData?.od_count !== undefined && studentData?.od_count !== null ? studentData.od_count : 7;
    const hasODsLeft = odCount > 0;
    const canSubmit = Boolean(studentData) && participatedEvents.length > 0 && !isDataLoading && hasODsLeft;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!formData.event_id) {
            setFormError("Please select an event.");
            return;
        }
        if (!participatedEventIds.has(formData.event_id)) {
            setFormError("You can submit OD only for events marked as participated.");
            return;
        }
        if (!formData.od_start_date || !formData.od_end_date) {
            setFormError("Please select both OD start and end dates.");
            return;
        }
        if (formData.od_start_date > formData.od_end_date) {
            setFormError("OD start date cannot be after OD end date.");
            return;
        }
        if (selectedEventDate && (formData.od_start_date > selectedEventDate || formData.od_end_date < selectedEventDate)) {
            setFormError("The OD date range must include the event date (" + selectedEventDate + ").");
            return;
        }
        if (!formData.mentor_id) {
            setFormError("Please select a mentor.");
            return;
        }
        if (!formData.reason || formData.reason.trim().length < 5) {
            setFormError("Please provide a meaningful reason (at least 5 characters).");
            return;
        }

        try {
            setLoading(true);

            // Build team array of roll numbers (for the database "team" column)
            const teamRollNumbers = isTeamRequest && teamMembers.length > 0
                ? teamMembers.map(m => m.roll_no).filter(Boolean)
                : [];

            await createODRequest({
                ...formData,
                student_id: user?.$id,
                student_email: user?.email || null,
                team: teamRollNumbers,
            });

            onSuccess();
            onClose();
            // Reset form
            setFormData({
                event_id: "",
                od_start_date: "",
                od_end_date: "",
                reason: "",
                mentor_id: "",
            });
            setIsTeamRequest(false);
            setTeamMembers([]);
        } catch (error) {
            console.error("Error creating OD request:", error);
            setFormError(error?.message || "Failed to submit OD request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-4 sm:p-8 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-[#1E2761]">New OD Request</h2>
                        <p className="text-gray-400 text-sm font-medium">Submit a request for attendance leave</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 max-h-[calc(90vh-110px)] overflow-y-auto">
                    {/* Student profile warning */}
                    {!studentDataLoading && !studentData && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Student Profile Not Found</p>
                            <p className="text-xs text-amber-700">
                                Your email ({user?.email}) was not found in the student database. Please contact your class advisor or coordinator to add your profile before submitting OD requests.
                            </p>
                        </div>
                    )}

                    {/* Missing advisor warning */}
                    {studentData && !studentData.advisor_id && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                            <p className="text-sm font-semibold text-orange-800 mb-1">⚠️ No Advisor Assigned</p>
                            <p className="text-xs text-orange-700">
                                Your profile doesn't have a class advisor assigned. OD submission will fail. Contact your coordinator.
                            </p>
                        </div>
                    )}

                    {/* OD Count Display */}
                    {studentData && (
                        <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${hasODsLeft
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-red-50 border border-red-200'
                            }`}>
                            <div>
                                <p className={`text-sm font-semibold ${hasODsLeft ? 'text-blue-800' : 'text-red-800'}`}>
                                    {hasODsLeft ? '📋 OD Requests Remaining' : '🚫 No OD Requests Left'}
                                </p>
                                <p className={`text-xs ${hasODsLeft ? 'text-blue-600' : 'text-red-600'}`}>
                                    {hasODsLeft
                                        ? `You have ${odCount} OD request${odCount !== 1 ? 's' : ''} remaining for this semester.`
                                        : 'You have used all your OD requests. Contact your advisor to get more allocated.'}
                                </p>
                            </div>
                            <span className={`text-2xl font-black ${hasODsLeft ? 'text-blue-700' : 'text-red-700'}`}>
                                {odCount}
                            </span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Select Event</label>
                        <select
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                            value={formData.event_id}
                            onChange={(e) => {
                                const eventId = e.target.value;
                                const ev = events.find(event => event.$id === eventId);
                                const evDate = normalizeDateOnly(ev?.event_time);
                                setFormData({
                                    ...formData,
                                    event_id: eventId,
                                    od_start_date: evDate || "",
                                    od_end_date: evDate || ""
                                });
                            }}
                        >
                            <option value="">
                                {fetchingParticipation || fetchingEvents
                                    ? "Loading events..."
                                    : "Choose a participated event..."}
                            </option>
                            {fetchingEvents ? (
                                <option disabled>Loading events...</option>
                            ) : participatedEvents.length === 0 ? (
                                <option disabled>No participated events available</option>
                            ) : (
                                participatedEvents.map(event => (
                                    <option key={event.$id} value={event.$id}>{event.event_name}</option>
                                ))
                            )}
                        </select>
                        {!fetchingEvents && !fetchingParticipation && participatedEvents.length === 0 && (
                            <p className="mt-2 text-xs text-gray-500">
                                Mark an event as <span className="font-bold">Participated</span> in the Events page to submit an OD request.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Start Date</label>
                            <input
                                required
                                type="date"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                                value={formData.od_start_date}
                                onChange={(e) => setFormData({ ...formData, od_start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">End Date</label>
                            <input
                                required
                                type="date"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                                value={formData.od_end_date}
                                onChange={(e) => setFormData({ ...formData, od_end_date: e.target.value })}
                                min={formData.od_start_date || undefined}
                            />
                        </div>
                    </div>

                    {selectedEventDate && (
                        <p className="text-xs text-gray-500 -mt-2">
                            Selected event date: <span className="font-bold text-gray-700">{selectedEventDate}</span>. Your OD range must include this date.
                        </p>
                    )}

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Reason</label>
                        <textarea
                            required
                            placeholder="Briefly explain your participation..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium resize-none"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Select Mentor / Class Advisor</label>
                        <select
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                            value={formData.mentor_id}
                            onChange={(e) => setFormData({ ...formData, mentor_id: e.target.value })}
                        >
                            <option value="">
                                {fetchingMentors ? "Loading mentors..." : "Select your mentor or advisor..."}
                            </option>
                            {mentors.map(faculty => (
                                <option key={faculty.$id} value={faculty.$id}>
                                    {faculty.name} ({(String(faculty.role || "")).charAt(0).toUpperCase() + (String(faculty.role || "")).slice(1)}, {faculty.department})
                                </option>
                            ))}
                        </select>
                        {!fetchingMentors && mentors.length === 0 && studentData && (
                            <p className="text-xs text-amber-600 mt-1">
                                No mentors/advisors found for your department ({studentData.department}). Contact your coordinator.
                            </p>
                        )}
                        {mentors.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">This faculty member will be the first to approve your OD.</p>
                        )}
                    </div>

                    {/* Team Request Feature Block */}
                    <div className={`rounded-2xl border transition-all duration-300 ${isTeamRequest ? 'bg-indigo-50/30 border-indigo-200 shadow-sm' : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'}`}>
                        <div className="p-4 sm:p-5">
                            <label className="flex items-center gap-4 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={isTeamRequest}
                                        onChange={(e) => {
                                            setIsTeamRequest(e.target.checked);
                                            if (!e.target.checked) {
                                                setTeamMembers([]);
                                                setTeamSearchQuery("");
                                                setTeamSearchResults([]);
                                            }
                                        }}
                                        className="peer sr-only"
                                    />
                                    <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-black transition-colors ${isTeamRequest ? 'text-indigo-900' : 'text-gray-700'}`}>
                                            👥 Group / Team Request
                                        </span>
                                        {isTeamRequest && (
                                            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-tighter rounded-full animate-pulse">ACTIVE</span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium">Add members to submit a single request for everyone.</p>
                                </div>
                            </label>

                            {isTeamRequest && (
                                <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* Advanced Search Input */}
                                    <div className="relative">
                                        <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em] mb-2 px-1">Search Members</label>
                                        <div className="relative group/search">
                                            <input
                                                type="text"
                                                placeholder="Enter roll number (e.g. 23CS...)"
                                                className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-sm transition-all"
                                                value={teamSearchQuery}
                                                onChange={(e) => setTeamSearchQuery(e.target.value)}
                                                onFocus={() => setTeamSearchFocused(true)}
                                                onBlur={() => setTimeout(() => setTeamSearchFocused(false), 200)}
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                                {teamSearching ? (
                                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <svg className="w-5 h-5 text-indigo-400 group-focus-within/search:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>

                                        {/* Premium Search Results Dropdown */}
                                        {teamSearchFocused && teamSearchQuery.length >= 2 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-indigo-100 rounded-2xl shadow-2xl z-20 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                                                {teamSearching ? (
                                                    <div className="p-8 text-center">
                                                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Searching Students...</p>
                                                    </div>
                                                ) : teamSearchResults.length === 0 ? (
                                                    <div className="p-8 text-center">
                                                        <p className="text-sm font-bold text-gray-400">No matching students found</p>
                                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Try a different roll number</p>
                                                    </div>
                                                ) : (
                                                    <div className="max-h-64 overflow-y-auto py-2">
                                                        <div className="px-4 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Search Results</div>
                                                        {teamSearchResults.map(student => (
                                                            <button
                                                                key={student.$id}
                                                                type="button"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    addTeamMember(student);
                                                                }}
                                                                className="w-full px-4 py-3 text-left hover:bg-indigo-600 group/item flex items-center justify-between gap-3 transition-all"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black group-hover/item:bg-white/20 group-hover/item:text-white transition-colors">
                                                                        {student.name?.charAt(0)?.toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-black text-gray-900 group-hover/item:text-white transition-colors">{student.name}</div>
                                                                        <div className="text-[10px] font-bold text-indigo-400 group-hover/item:text-white/70 transition-colors uppercase tracking-tight">{student.roll_no}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-[10px] font-black text-gray-400 group-hover/item:text-white/80 transition-colors uppercase">{student.department}</div>
                                                                    <div className="text-[9px] font-bold text-gray-300 group-hover/item:text-white/60 transition-colors">{student.year} Year / {student.section}</div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Refined Team List */}
                                    {teamMembers.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">TEAM MEMBERS ({teamMembers.length})</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setTeamMembers([])}
                                                    className="text-[10px] font-black text-red-400 hover:text-red-600 transition-colors uppercase"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {teamMembers.map(member => (
                                                    <div
                                                        key={member.$id}
                                                        className="flex items-center justify-between bg-white border border-indigo-100 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-sm font-black shadow-lg shadow-indigo-200">
                                                                {member.name?.charAt(0)?.toUpperCase() || "?"}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-[#1E2761] leading-tight">{member.name}</p>
                                                                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-tight">
                                                                    {member.roll_no} • {member.department} {member.year ? `• ${member.year}Y` : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTeamMember(member.$id)}
                                                            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        >
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {formError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                            <p className="text-sm font-medium text-red-700">{formError}</p>
                        </div>
                    )}

                    <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !canSubmit}
                            className="sm:flex-[2] px-6 py-4 bg-[#1E2761] text-white font-bold rounded-2xl hover:bg-[#2d3a7d] transition-all shadow-lg shadow-[#1E2761]/20 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Submitting..." : isTeamRequest && teamMembers.length > 0 ? `Submit Team Request (${teamMembers.length + 1} members)` : "Submit Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
