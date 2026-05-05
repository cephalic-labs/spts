"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getEvents } from "@/lib/services/eventService";
import {
  getStudentEventParticipations,
  PARTICIPATION_STATUS,
} from "@/lib/services/eventParticipationService";
import { Icons } from "@/components/layout";
import {
  createODRequest,
  getStudentODRequests,
} from "@/lib/services/odRequestService";
import {
  getStudentByAppwriteUserId,
  getStudentByEmail,
  searchStudentsByRollNo,
} from "@/lib/services/studentService";
import { getFaculties } from "@/lib/services/facultyService";
import { OD_STATUS, OD_CATEGORY_FIELDS } from "@/lib/dbConfig";

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

function getODValue(student, field) {
  const value = student?.[field];
  if (value === undefined || value === null || value === "") return 0;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getStudentTotalOD(student) {
  const totalCount =
    student?.od_count !== undefined && student?.od_count !== null
      ? parseInt(student.od_count, 10)
      : 7;
  return Number.isNaN(totalCount) ? 7 : totalCount;
}

function hasCategoryBreakdown(student) {
  return OD_CATEGORY_FIELDS.some(
    (field) => student?.[field] !== undefined && student?.[field] !== null,
  );
}

function getEventODField(event) {
  if (!event?.host_type) return null;

  const category = String(event.host_type).toLowerCase();
  if (category === "iit_nit") return "iit_nit";
  if (category === "nirf") return "nirf";
  if (category === "industry") return "industry";
  if (category === "others") return "others";
  return "university";
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

  const loadEvents = useCallback(async () => {
    try {
      setFetchingEvents(true);
      const response = await getEvents(100);
      setEvents(response.documents || []);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setFetchingEvents(false);
    }
  }, []);

  const loadStudentInfo = useCallback(async () => {
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
          setFormData((prev) => ({ ...prev, mentor_id: student.mentor_id }));
        }

        // Fetch potential mentors AND advisors (faculty in same department)
        setFetchingMentors(true);
        try {
          const results = await Promise.allSettled([
            getFaculties({ department: student.department, role: "mentor" }),
            getFaculties({ department: student.department, role: "advisor" }),
          ]);

          const combined = [];
          for (const result of results) {
            if (result.status === "fulfilled") {
              combined.push(...(result.value.documents || []));
            }
          }

          // Filters duplicates based on $id
          const uniqueFaculty = Array.from(
            new Map(combined.map((item) => [item.$id, item])).values(),
          );
          setMentors(uniqueFaculty);

          // Ensure form uses $id even if student profile has faculty_id (legacy)
          if (student.mentor_id) {
            const assignedMentor = uniqueFaculty.find(
              (f) =>
                f.faculty_id === student.mentor_id ||
                f.$id === student.mentor_id,
            );
            if (assignedMentor) {
              setFormData((prev) => ({
                ...prev,
                mentor_id: assignedMentor.$id,
              }));
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
  }, [user]);

  const loadParticipationInfo = useCallback(async () => {
    if (!user?.$id) return;

    try {
      setFetchingParticipation(true);
      // Search by both Appwrite user ID and student document ID
      // to find participation records regardless of which ID was used to create them
      const idsToSearch = [user.$id];
      if (studentData?.$id && studentData.$id !== user.$id) {
        idsToSearch.push(studentData.$id);
      }
      const response = await getStudentEventParticipations(idsToSearch);
      const participatedIds = new Set(
        (response.documents || [])
          .filter((item) => item.status === PARTICIPATION_STATUS.PARTICIPATED)
          .map((item) => item.event_id),
      );
      setParticipatedEventIds(participatedIds);
    } catch (error) {
      console.error("Error loading participation info:", error);
    } finally {
      setFetchingParticipation(false);
    }
  }, [user?.$id, studentData?.$id]);

  const loadPendingODRequests = useCallback(async (studentId, rollNo) => {
    if (!studentId) return;

    try {
      const response = await getStudentODRequests(studentId, 100, rollNo);
      const pendingIds = new Set(
        (response.documents || [])
          .filter((od) => {
            const s = od.current_status;
            return (
              s &&
              (s.startsWith("pending_") ||
                s === OD_STATUS.GRANTED ||
                s === OD_STATUS.APPROVED)
            );
          })
          .map((od) => od.event_id),
      );
      setPendingEventsRequest(pendingIds);
    } catch (error) {
      console.error("Error loading pending OD requests:", error);
    }
  }, []);

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
  }, [isOpen, loadEvents, loadStudentInfo, loadParticipationInfo]);

  useEffect(() => {
    if (isOpen && user?.$id) {
      loadPendingODRequests(user?.$id, studentData?.roll_no);
    }
  }, [isOpen, user?.$id, studentData, loadPendingODRequests]);
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
        const existingIds = new Set(teamMembers.map((m) => m.$id));
        const filtered = results.filter((s) => {
          if (studentData && s.$id === studentData.$id) return false;
          if (existingIds.has(s.$id)) return false;
          // Only show students with available OD count
          const mCount = getStudentTotalOD(s);
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

  function addTeamMember(student) {
    setTeamMembers((prev) => [...prev, student]);
    setTeamSearchQuery("");
    setTeamSearchResults([]);
  }

  function removeTeamMember(studentId) {
    setTeamMembers((prev) => prev.filter((m) => m.$id !== studentId));
  }

  const selectedEvent =
    events.find((event) => event.$id === formData.event_id) || null;
  const selectedEventDate = normalizeDateOnly(selectedEvent?.event_time);
  const participatedEvents = events.filter(
    (event) =>
      participatedEventIds.has(event.$id) &&
      !pendingEventsRequest.has(event.$id),
  );
  const isDataLoading =
    studentDataLoading || fetchingEvents || fetchingParticipation;
  const odBreakdown = studentData
    ? OD_CATEGORY_FIELDS.reduce((accumulator, field) => {
        accumulator[field] = getODValue(studentData, field);
        return accumulator;
      }, {})
    : {};
  const odCount = studentData ? getStudentTotalOD(studentData) : 7;
  const hasODsLeft = odCount > 0;
  const selectedEventCategoryField = getEventODField(selectedEvent);
  const canSubmit =
    Boolean(studentData) &&
    participatedEvents.length > 0 &&
    !isDataLoading &&
    hasODsLeft;

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
    if (
      selectedEventDate &&
      (formData.od_start_date > selectedEventDate ||
        formData.od_end_date < selectedEventDate)
    ) {
      setFormError(
        "The OD date range must include the event date (" +
          selectedEventDate +
          ").",
      );
      return;
    }
    if (!formData.mentor_id) {
      setFormError("Please select a mentor.");
      return;
    }
    if (!formData.reason || formData.reason.trim().length < 5) {
      setFormError(
        "Please provide a meaningful reason (at least 5 characters).",
      );
      return;
    }
    if (!hasODsLeft) {
      setFormError("You do not have any OD left for this semester.");
      return;
    }

    try {
      setLoading(true);

      // Build team array of roll numbers (for the database "team" column)
      const teamRollNumbers =
        isTeamRequest && teamMembers.length > 0
          ? teamMembers.map((m) => m.roll_no).filter(Boolean)
          : [];

      await createODRequest({
        ...formData,
        student_id: studentData?.$id || user?.$id,
        appwrite_user_id: user?.$id,
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
      setFormError(
        error?.message || "Failed to submit OD request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-8">
          <div>
            <h2 className="text-xl font-black text-[#1E2761] sm:text-2xl">
              New OD Request
            </h2>
            <p className="text-sm font-medium text-gray-400">
              Submit a request for attendance leave
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(90vh-110px)] space-y-6 overflow-y-auto p-4 sm:p-8"
        >
          {/* Student profile warning */}
          {!studentDataLoading && !studentData && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="mb-1 text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                <Icons.Warning className="w-4 h-4 text-amber-600" />
                Student Profile Not Found
              </p>
              <p className="text-xs text-amber-700">
                Your email ({user?.email}) was not found in the student
                database. Please contact your class advisor or coordinator to
                add your profile before submitting OD requests.
              </p>
            </div>
          )}

          {/* Missing advisor warning */}
          {studentData && !studentData.advisor_id && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <p className="mb-1 text-sm font-semibold text-orange-800 flex items-center gap-1.5">
                <Icons.Warning className="w-4 h-4 text-orange-600" />
                No Advisor Assigned
              </p>
              <p className="text-xs text-orange-700">
                Your profile does not have a class advisor assigned. OD
                submission will fail. Contact your coordinator.
              </p>
            </div>
          )}

          {/* OD Count Display */}
          {studentData && (
            <div
              className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                hasODsLeft
                  ? "border border-blue-200 bg-blue-50"
                  : "border border-red-200 bg-red-50"
              }`}
            >
              <div>
                <p
                  className={`text-sm font-semibold flex items-center gap-1.5 ${hasODsLeft ? "text-blue-800" : "text-red-800"}`}
                >
                  {hasODsLeft ? (
                    <>
                      <Icons.Clipboard className="w-4 h-4" />
                      OD Requests Remaining
                    </>
                  ) : (
                    <>
                      <Icons.Ban className="w-4 h-4" />
                      No OD Requests Left
                    </>
                  )}
                </p>
                <p
                  className={`text-xs ${hasODsLeft ? "text-blue-600" : "text-red-600"}`}
                >
                  {hasODsLeft
                    ? `You have ${odCount} OD request${odCount !== 1 ? "s" : ""} remaining for this semester.`
                    : "You have used all your OD requests. Contact your advisor to get more allocated."}
                </p>
              </div>
              <span
                className={`text-2xl font-black ${hasODsLeft ? "text-blue-700" : "text-red-700"}`}
              >
                {odCount}
              </span>
            </div>
          )}

          {studentData && (
            <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-700">
                  Category-wise OD balance
                </p>
                {selectedEvent && (
                  <p className="text-xs text-gray-500">
                    Selected event host type:{" "}
                    <span className="font-bold text-[#1E2761]">
                      {selectedEventCategoryField.replace("_", " ")}
                    </span>
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {OD_CATEGORY_FIELDS.map((field) => (
                  <div
                    key={field}
                    className={`rounded-xl border px-3 py-2 ${selectedEventCategoryField === field ? "border-[#1E2761] bg-[#1E2761]/5" : "border-gray-200 bg-white"}`}
                  >
                    <div className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                      {field.replace("_", " ")}
                    </div>
                    <div className="text-lg font-black text-gray-800">
                      {odBreakdown[field] ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {studentData && !hasCategoryBreakdown(studentData) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-800">
                Legacy OD balance
              </p>
              <p className="mt-1 text-xs text-amber-700">
                This student record still uses the old single OD count. Current
                available OD: <span className="font-bold">{odCount}</span>.
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
              Select Event
            </label>
            <select
              required
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
              value={formData.event_id}
              onChange={(e) => {
                const eventId = e.target.value;
                const ev = events.find((event) => event.$id === eventId);
                const evDate = normalizeDateOnly(ev?.event_time);
                setFormData({
                  ...formData,
                  event_id: eventId,
                  od_start_date: evDate || "",
                  od_end_date: evDate || "",
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
                participatedEvents.map((event) => (
                  <option key={event.$id} value={event.$id}>
                    {event.event_name}
                  </option>
                ))
              )}
            </select>
            {!fetchingEvents &&
              !fetchingParticipation &&
              participatedEvents.length === 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Mark an event as{" "}
                  <span className="font-bold">Participated</span> in the Events
                  page to submit an OD request.
                </p>
              )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
                Start Date
              </label>
              <input
                required
                type="date"
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                value={formData.od_start_date}
                onChange={(e) =>
                  setFormData({ ...formData, od_start_date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
                End Date
              </label>
              <input
                required
                type="date"
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                value={formData.od_end_date}
                onChange={(e) =>
                  setFormData({ ...formData, od_end_date: e.target.value })
                }
                min={formData.od_start_date || undefined}
              />
            </div>
          </div>

          {selectedEventDate && (
            <p className="-mt-2 text-xs text-gray-500">
              Selected event date:{" "}
              <span className="font-bold text-gray-700">
                {selectedEventDate}
              </span>
              . Your OD range must include this date.
            </p>
          )}

          <div>
            <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
              Reason
            </label>
            <textarea
              required
              placeholder="Briefly explain your participation..."
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
              Select Mentor / Class Advisor
            </label>
            <select
              required
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
              value={formData.mentor_id}
              onChange={(e) =>
                setFormData({ ...formData, mentor_id: e.target.value })
              }
            >
              <option value="">
                {fetchingMentors
                  ? "Loading mentors..."
                  : "Select your mentor or advisor..."}
              </option>
              {mentors.map((faculty) => (
                <option key={faculty.$id} value={faculty.$id}>
                  {faculty.name} (
                  {String(faculty.role || "")
                    .charAt(0)
                    .toUpperCase() + String(faculty.role || "").slice(1)}
                  , {faculty.department})
                </option>
              ))}
            </select>
            {!fetchingMentors && mentors.length === 0 && studentData && (
              <p className="mt-1 text-xs text-amber-600">
                No mentors/advisors found for your department (
                {studentData.department}). Contact your coordinator.
              </p>
            )}
            {mentors.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                This faculty member will be the first to approve your OD.
              </p>
            )}
          </div>

          {/* Team Request Feature Block */}
          <div
            className={`rounded-2xl border transition-all duration-300 ${isTeamRequest ? "border-indigo-200 bg-indigo-50/30 shadow-sm" : "border-gray-100 bg-gray-50/50 hover:border-gray-200"}`}
          >
            <div className="p-4 sm:p-5">
              <label className="group flex cursor-pointer items-center gap-4">
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
                  <div className="peer h-6 w-12 rounded-full bg-gray-200 transition-colors peer-checked:bg-indigo-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-6"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-black transition-colors flex items-center gap-1.5 ${isTeamRequest ? "text-indigo-900" : "text-gray-700"}`}
                    >
                      <Icons.Users className="w-4 h-4" />
                      Group / Team Request
                    </span>
                    {isTeamRequest && (
                      <span className="animate-pulse rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-black tracking-tighter text-white uppercase">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-gray-500">
                    Add members to submit a single request for everyone.
                  </p>
                </div>
              </label>

              {isTeamRequest && (
                <div className="animate-in fade-in slide-in-from-top-2 mt-5 space-y-4 duration-300">
                  {/* Advanced Search Input */}
                  <div className="relative">
                    <label className="mb-2 block px-1 text-[10px] font-black tracking-[0.15em] text-indigo-400 uppercase">
                      Search Members
                    </label>
                    <div className="group/search relative">
                      <input
                        type="text"
                        placeholder="Enter roll number (e.g. 23CS...)"
                        className="w-full rounded-xl border-2 border-indigo-100 bg-white py-3.5 pr-4 pl-11 text-sm font-bold transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                        value={teamSearchQuery}
                        onChange={(e) => setTeamSearchQuery(e.target.value)}
                        onFocus={() => setTeamSearchFocused(true)}
                        onBlur={() =>
                          setTimeout(() => setTeamSearchFocused(false), 200)
                        }
                      />
                      <div className="absolute top-1/2 left-4 -translate-y-1/2">
                        {teamSearching ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                        ) : (
                          <svg
                            className="h-5 w-5 text-indigo-400 transition-colors group-focus-within/search:text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Premium Search Results Dropdown */}
                    {teamSearchFocused && teamSearchQuery.length >= 2 && (
                      <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-2xl border border-indigo-100 bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl duration-150">
                        {teamSearching ? (
                          <div className="p-8 text-center">
                            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                            <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase">
                              Searching Students...
                            </p>
                          </div>
                        ) : teamSearchResults.length === 0 ? (
                          <div className="p-8 text-center">
                            <p className="text-sm font-bold text-gray-400">
                              No matching students found
                            </p>
                            <p className="mt-1 text-[10px] tracking-wider text-gray-400 uppercase">
                              Try a different roll number
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto py-2">
                            <div className="mb-1 border-b border-gray-50 px-4 py-2 text-[9px] font-black tracking-widest text-gray-400 uppercase">
                              Search Results
                            </div>
                            {teamSearchResults.map((student) => (
                              <button
                                key={student.$id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  addTeamMember(student);
                                }}
                                className="group/item flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-all hover:bg-indigo-600"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 font-black text-indigo-600 transition-colors group-hover/item:bg-white/20 group-hover/item:text-white">
                                    {student.name?.charAt(0)?.toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="text-sm font-black text-gray-900 transition-colors group-hover/item:text-white">
                                      {student.name}
                                    </div>
                                    <div className="text-[10px] font-bold tracking-tight text-indigo-400 uppercase transition-colors group-hover/item:text-white/70">
                                      {student.roll_no}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] font-black text-gray-400 uppercase transition-colors group-hover/item:text-white/80">
                                    {student.department}
                                  </div>
                                  <div className="text-[9px] font-bold text-gray-300 transition-colors group-hover/item:text-white/60">
                                    {student.year} Year / {student.section}
                                  </div>
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
                        <p className="text-[10px] font-black tracking-[0.15em] text-indigo-400 uppercase">
                          TEAM MEMBERS ({teamMembers.length})
                        </p>
                        <button
                          type="button"
                          onClick={() => setTeamMembers([])}
                          className="text-[10px] font-black text-red-400 uppercase transition-colors hover:text-red-600"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {teamMembers.map((member) => (
                          <div
                            key={member.$id}
                            className="group flex items-center justify-between rounded-2xl border border-indigo-100 bg-white px-4 py-3 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-200">
                                {member.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="text-sm leading-tight font-black text-[#1E2761]">
                                  {member.name}
                                </p>
                                <p className="text-[10px] font-black tracking-tight text-indigo-400 uppercase">
                                  {member.roll_no} • {member.department}{" "}
                                  {member.year ? `• ${member.year}Y` : ""}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTeamMember(member.$id)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-300 transition-all hover:bg-red-50 hover:text-red-600"
                            >
                              <svg
                                className="h-5 w-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
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
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">{formError}</p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl bg-gray-100 px-6 py-4 font-bold text-gray-500 transition-all hover:bg-gray-200 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="rounded-2xl bg-[#1E2761] px-6 py-4 font-bold text-white shadow-lg shadow-[#1E2761]/20 transition-all hover:bg-[#2d3a7d] active:scale-95 disabled:opacity-50 sm:flex-[2]"
            >
              {loading
                ? "Submitting..."
                : isTeamRequest && teamMembers.length > 0
                  ? `Submit Team Request (${teamMembers.length + 1} members)`
                  : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
