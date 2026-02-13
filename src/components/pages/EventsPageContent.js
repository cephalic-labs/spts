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
import { Icons } from "@/components/layout";
import CreateEventModal from "./CreateEventModal";
import Link from "next/link";

function formatEventDate(value) {
    if (!value) return "N/A";

    if (typeof value === "string") {
        const matchedDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (matchedDate) {
            const year = Number(matchedDate[1]);
            const month = Number(matchedDate[2]);
            const day = Number(matchedDate[3]);
            return new Date(year, month - 1, day).toLocaleDateString(undefined, { dateStyle: "medium" });
        }
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return String(value);
    }

    return parsedDate.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function getStatusBadgeClass(status) {
    if (status === PARTICIPATION_STATUS.PARTICIPATED) {
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    }

    if (status === PARTICIPATION_STATUS.NOT_PARTICIPATED) {
        return "bg-rose-50 text-rose-700 border border-rose-100";
    }

    return "bg-gray-100 text-gray-600 border border-gray-200";
}

function getStatusLabel(status) {
    if (status === PARTICIPATION_STATUS.PARTICIPATED) return "Participated";
    if (status === PARTICIPATION_STATUS.NOT_PARTICIPATED) return "Not Participated";
    return "Not Updated";
}

function getParticipationButtonClass(currentStatus, buttonStatus) {
    const isSelected = currentStatus === buttonStatus;

    if (buttonStatus === PARTICIPATION_STATUS.PARTICIPATED) {
        return isSelected
            ? "bg-emerald-800 text-white"
            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
    }

    return isSelected
        ? "bg-rose-800 text-white"
        : "bg-rose-100 text-rose-800 hover:bg-rose-200";
}

export default function EventsPageContent({ role }) {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [participationByEvent, setParticipationByEvent] = useState({});
    const [savingParticipationFor, setSavingParticipationFor] = useState(null);

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        if (role === "student" && user?.$id) {
            loadStudentParticipations(user.$id);
        }
    }, [role, user?.$id]);

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

    const handleOpenEvent = async (eventId) => {
        try {
            await incrementViewCount(eventId);
            setEvents((prev) =>
                prev.map((event) =>
                    event.$id === eventId
                        ? { ...event, view_count: (event.view_count || 0) + 1 }
                        : event
                )
            );
        } catch (err) {
            console.error("Failed to increment view count:", err);
        }
    };

    const handleParticipationChange = async (eventId, status) => {
        const studentId = user?.$id;
        if (!studentId) return;

        setSavingParticipationFor(eventId);

        try {
            const result = await setStudentParticipationStatus(eventId, studentId, status);

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
                            participation_count: Math.max((event.participation_count || 0) + result.countDelta, 0),
                        };
                    })
                );
            }
        } catch (err) {
            alert("Failed to update your participation status.");
            console.error(err);
        } finally {
            setSavingParticipationFor(null);
        }
    };

    const canCreateEvent = ["sudo", "admin", "coordinator"].includes(role);
    const canManageEvents = ["sudo", "admin"].includes(role);
    const canSelfReportParticipation = role === "student" && Boolean(user?.$id);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-[#1E2761] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600">{error}</p>
                <button onClick={loadEvents} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#1E2761]">Events</h1>
                    <p className="text-gray-500 text-sm mt-1">Browse and manage events</p>
                </div>
                {canCreateEvent && (
                    <button
                        onClick={handleCreate}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E2761] text-white rounded-xl hover:bg-[#2d3a7d] transition-colors shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

            {/* Events Grid */}
            {events.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.Events />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 mb-2">No Events Found</h3>
                    <p className="text-gray-500">Events will appear here once created.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map((event) => (
                        <div
                            key={event.$id}
                            className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 hover:shadow-md transition-all group flex flex-col md:flex-row gap-6 md:items-start"
                        >
                            {/* Event Details */}
                            <div className="flex-grow min-w-0 text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-[#1E2761] text-xl sm:text-2xl">
                                            {event.event_name}
                                        </h3>
                                        {event.event_host && (
                                            <p className="text-sm font-semibold text-[#1E2761]/70">
                                                Hosted by {event.event_host}
                                            </p>
                                        )}
                                    </div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 w-fit mx-auto md:mx-0 h-fit self-center">
                                        {event.participation_count || 0} participants
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm sm:text-base line-clamp-2 mb-6 max-w-3xl">
                                    {event.event_description}
                                </p>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 font-medium">
                                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
                                        <svg className="w-5 h-5 text-[#1E2761]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-gray-400 mr-1">Date:</span>
                                        {formatEventDate(event.event_time)}
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
                                        <svg className="w-5 h-5 text-[#1E2761]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-gray-400 mr-1">Deadline:</span>
                                        {formatEventDate(event.event_reg_deadline)}
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
                                        <svg className="w-5 h-5 text-[#1E2761]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {event.view_count || 0} views
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="w-full md:w-[300px] lg:w-[320px] md:flex-none flex flex-col gap-3">
                                {event.event_url ? (
                                    <Link
                                        href={event.event_url}
                                        target="_blank"
                                        onClick={() => handleOpenEvent(event.$id)}
                                        className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-[#1E2761] text-white rounded-2xl font-bold text-sm sm:text-base transition-all hover:bg-[#2d3a7d] hover:shadow-xl hover:-translate-y-0.5 w-full"
                                    >
                                        Open Event
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </Link>
                                ) : (
                                    <button className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-100 text-gray-400 rounded-2xl font-bold text-sm sm:text-base cursor-not-allowed w-full">
                                        No Link Available
                                    </button>
                                )}

                                {canSelfReportParticipation && (
                                    <div className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3">
                                        {(() => {
                                            const currentStatus = participationByEvent[event.$id]?.status;
                                            return (
                                                <>
                                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                            Your Status
                                                        </p>
                                                        <span
                                                            className={`max-w-full px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadgeClass(currentStatus)}`}
                                                        >
                                                            {getStatusLabel(currentStatus)}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleParticipationChange(event.$id, PARTICIPATION_STATUS.PARTICIPATED)}
                                                            disabled={
                                                                savingParticipationFor === event.$id ||
                                                                currentStatus === PARTICIPATION_STATUS.PARTICIPATED
                                                            }
                                                            className={`min-w-0 px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider leading-tight whitespace-normal break-words disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getParticipationButtonClass(currentStatus, PARTICIPATION_STATUS.PARTICIPATED)}`}
                                                        >
                                                            Participated
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleParticipationChange(event.$id, PARTICIPATION_STATUS.NOT_PARTICIPATED)}
                                                            disabled={
                                                                savingParticipationFor === event.$id ||
                                                                currentStatus === PARTICIPATION_STATUS.NOT_PARTICIPATED
                                                            }
                                                            className={`min-w-0 px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider leading-tight whitespace-normal break-words disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getParticipationButtonClass(currentStatus, PARTICIPATION_STATUS.NOT_PARTICIPATED)}`}
                                                        >
                                                            Not Participated
                                                        </button>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}

                                {canManageEvents && (
                                    <div className="flex items-center gap-3 w-full">
                                        <button
                                            onClick={() => handleEdit(event)}
                                            className="flex-1 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-[#1E2761] border border-[#1E2761]/20 rounded-xl hover:bg-[#1E2761]/5 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.$id)}
                                            className="flex-1 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )
            }
        </div>
    );
}
