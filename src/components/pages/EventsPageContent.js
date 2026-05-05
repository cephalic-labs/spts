"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  deleteEvent,
  getEvents,
  incrementViewCount,
} from "@/lib/services/eventService";
import {
  getStudentEventParticipations,
  PARTICIPATION_STATUS,
  setStudentParticipationStatus,
} from "@/lib/services/eventParticipationService";
import { getStudentByAppwriteUserId } from "@/lib/services/studentService";
import { getStudentODRequests } from "@/lib/services/odRequestService";
import {
  OD_STATUS,
  ADMIN_ROLES,
  ADMIN_COORDINATOR_ROLES,
} from "@/lib/dbConfig";
import { Icons } from "@/components/layout";
import CreateEventModal from "./CreateEventModal";
import EventDetailsModal from "./EventDetailsModal";
import { formatEventDate } from "@/lib/utils/eventDates";

export default function EventsPageContent({ role }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participationByEvent, setParticipationByEvent] = useState({});
  const [savingParticipationFor, setSavingParticipationFor] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [viewEventModalOpen, setViewEventModalOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [pendingEventsRequest, setPendingEventsRequest] = useState(new Set());
  const [studentProfile, setStudentProfile] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (role === "student" && user?.$id) {
      loadStudentParticipations(user.$id);
      loadStudentProfile(user.$id);
    }
  }, [role, user?.$id]);

  useEffect(() => {
    if (role === "student" && user?.$id) {
      loadPendingODRequests(user.$id, studentProfile?.roll_no);
    }
  }, [role, user?.$id, studentProfile]);

  async function loadStudentProfile(studentId) {
    try {
      const profile = await getStudentByAppwriteUserId(studentId);
      setStudentProfile(profile);
    } catch (err) {
      console.error("Failed to load student profile:", err);
    }
  }

  async function loadPendingODRequests(studentId, rollNo) {
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
    } catch (err) {
      console.error("Failed to load student OD requests:", err);
    }
  }

  async function loadEvents() {
    try {
      setLoading(true);
      const response = await getEvents(50);
      setEvents(response.documents || []);
    } catch (err) {
      setError("Failed to load events");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadStudentParticipations(studentId) {
    try {
      const response = await getStudentEventParticipations(studentId);
      const nextMap = {};
      for (const participation of response.documents || []) {
        nextMap[participation.event_id] = participation;
      }
      setParticipationByEvent(nextMap);
    } catch (err) {
      console.error("Failed to load student participation statuses:", err);
    }
  }

  const handleCreate = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (eventData) => {
    setSelectedEvent(eventData);
    setIsModalOpen(true);
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      await deleteEvent(eventId);
      await loadEvents();
    } catch (err) {
      alert("Failed to delete event. Please try again.");
      console.error(err);
    }
  };

  const handleOpenEvent = async (event) => {
    setViewingEvent(event);
    setViewEventModalOpen(true);
    if (event.event_url) {
      try {
        await incrementViewCount(event.$id);
        setEvents((prev) =>
          prev.map((e) =>
            e.$id === event.$id
              ? { ...e, view_count: (e.view_count || 0) + 1 }
              : e,
          ),
        );
      } catch (err) {
        console.error("Failed to increment view count:", err);
      }
    }
  };

  const handleParticipationChange = async (eventId, status) => {
    const studentId = user?.$id;
    if (!studentId) return;

    setSavingParticipationFor(eventId);

    try {
      const result = await setStudentParticipationStatus(
        eventId,
        studentId,
        status,
      );

      setParticipationByEvent((prev) => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          ...result.document,
          event_id: eventId,
          student_id: studentId,
          status,
        },
      }));

      if (result.countDelta !== 0) {
        setEvents((prev) =>
          prev.map((event) => {
            if (event.$id !== eventId) return event;
            return {
              ...event,
              participation_count: Math.max(
                (event.participation_count || 0) + result.countDelta,
                0,
              ),
            };
          }),
        );
      }
    } catch (err) {
      alert("Failed to update your participation status.");
      console.error(err);
    } finally {
      setSavingParticipationFor(null);
    }
  };

  const canCreateEvent = ADMIN_COORDINATOR_ROLES.includes(role);
  const canManageEvents = ADMIN_ROLES.includes(role);
  const canSelfReportParticipation = role === "student" && Boolean(user?.$id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E2761] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadEvents}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2761]">Events</h1>
          <p className="mt-1 text-sm text-gray-500">Browse and manage events</p>
        </div>
        {canCreateEvent && (
          <button
            onClick={handleCreate}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E2761] px-4 py-2.5 text-white shadow-sm transition-colors hover:bg-[#2d3a7d] sm:w-auto"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Event
          </button>
        )}
      </div>

      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadEvents}
        initialData={selectedEvent}
      />

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search events by name..."
            className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-10 leading-5 placeholder-gray-500 transition-colors focus:border-[#1E2761] focus:placeholder-gray-400 focus:ring-1 focus:ring-[#1E2761] focus:outline-none sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sm:w-64">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-10 pl-3 text-base transition-colors focus:border-[#1E2761] focus:ring-[#1E2761] focus:outline-none sm:text-sm"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="participation_desc">Most Participations</option>
            <option value="view_desc">Most Views</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {(() => {
        const filteredEvents = events
          .filter((event) =>
            (event.event_name || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase()),
          )
          .filter((event) => {
            // Hide events that have a pending OD request
            if (role === "student" && pendingEventsRequest.has(event.$id)) {
              return false;
            }
            return true;
          })
          .sort((a, b) => {
            if (sortBy === "date_desc") {
              return new Date(b.event_time) - new Date(a.event_time);
            }
            if (sortBy === "date_asc") {
              return new Date(a.event_time) - new Date(b.event_time);
            }
            if (sortBy === "participation_desc") {
              return (
                (b.participation_count || 0) - (a.participation_count || 0)
              );
            }
            if (sortBy === "view_desc") {
              return (b.view_count || 0) - (a.view_count || 0);
            }
            return 0;
          });

        if (filteredEvents.length === 0) {
          return (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Icons.Events />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-700">
                No Events Found
              </h3>
              <p className="text-gray-500">
                Events matching your criteria will appear here.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={event.$id}
                className="group flex flex-col gap-6 rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:shadow-md md:flex-row md:items-start md:p-8"
              >
                {/* Event Details */}
                <div className="min-w-0 flex-grow text-center md:text-left">
                  <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex flex-col">
                      <h3 className="text-xl font-bold text-[#1E2761] sm:text-2xl">
                        {event.event_name}
                      </h3>
                      {event.event_host && (
                        <p className="text-sm font-semibold text-[#1E2761]/70">
                          Hosted by {event.event_host}
                        </p>
                      )}
                    </div>
                    <span className="mx-auto inline-flex h-fit w-fit items-center self-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 md:mx-0">
                      {event.participation_count || 0} participants
                    </span>
                  </div>
                  <p className="mb-6 line-clamp-2 max-w-3xl text-sm text-gray-500 sm:text-base">
                    {event.event_description}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-gray-500 md:justify-start">
                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2">
                      <svg
                        className="h-5 w-5 text-[#1E2761]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="mr-1 text-gray-400">Date:</span>
                      {formatEventDate(event.event_time)}
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2">
                      <svg
                        className="h-5 w-5 text-[#1E2761]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="mr-1 text-gray-400">Deadline:</span>
                      {formatEventDate(event.event_reg_deadline)}
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2">
                      <svg
                        className="h-5 w-5 text-[#1E2761]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      {event.view_count || 0} views
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex w-full flex-col gap-3 md:w-[300px] md:flex-none lg:w-[320px]">
                  {event.event_url ? (
                    <button
                      onClick={() => handleOpenEvent(event)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1E2761] px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#2d3a7d] hover:shadow-xl sm:px-8 sm:py-4 sm:text-base"
                    >
                      View Details
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  ) : (
                    <button className="w-full cursor-not-allowed rounded-2xl bg-gray-100 px-6 py-3 text-sm font-bold text-gray-400 sm:px-8 sm:py-4 sm:text-base">
                      No Link Available
                    </button>
                  )}

                  {canManageEvents && (
                    <div className="flex w-full items-center gap-3">
                      <button
                        onClick={() => handleEdit(event)}
                        className="flex-1 rounded-xl border border-[#1E2761]/20 px-4 py-2.5 text-xs font-black tracking-widest text-[#1E2761] uppercase transition-colors hover:bg-[#1E2761]/5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.$id)}
                        className="flex-1 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-black tracking-widest text-red-600 uppercase transition-colors hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      <EventDetailsModal
        isOpen={viewEventModalOpen}
        onClose={() => setViewEventModalOpen(false)}
        event={viewingEvent}
        canSelfReportParticipation={canSelfReportParticipation}
        currentParticipationStatus={
          viewingEvent ? participationByEvent[viewingEvent.$id]?.status : null
        }
        isSavingParticipation={savingParticipationFor === viewingEvent?.$id}
        onParticipationChange={handleParticipationChange}
      />
    </div>
  );
}
