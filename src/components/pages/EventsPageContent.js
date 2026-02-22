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
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("date_desc");
    const [viewEventModalOpen, setViewEventModalOpen] = useState(false);
    const [viewingEvent, setViewingEvent] = useState(null);

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
                            : e
                    )
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

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search events by name..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#1E2761] focus:border-[#1E2761] sm:text-sm transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="sm:w-64">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-200 border bg-white focus:outline-none focus:ring-[#1E2761] focus:border-[#1E2761] sm:text-sm rounded-xl transition-colors"
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
                    .filter(event => (event.event_name || "").toLowerCase().includes(searchQuery.toLowerCase()))
                    .sort((a, b) => {
                        if (sortBy === "date_desc") {
                            return new Date(b.event_time) - new Date(a.event_time);
                        }
                        if (sortBy === "date_asc") {
                            return new Date(a.event_time) - new Date(b.event_time);
                        }
                        if (sortBy === "participation_desc") {
                            return (b.participation_count || 0) - (a.participation_count || 0);
                        }
                        if (sortBy === "view_desc") {
                            return (b.view_count || 0) - (a.view_count || 0);
                        }
                        return 0;
                    });

                if (filteredEvents.length === 0) {
                    return (
                        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icons.Events />
                            </div>
                            <h3 className="text-lg font-bold text-gray-700 mb-2">No Events Found</h3>
                            <p className="text-gray-500">Events matching your criteria will appear here.</p>
                        </div>
                    );
                }

                return (
                    <div className="space-y-4">
                        {filteredEvents.map((event) => (
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
                                        <button
                                            onClick={() => handleOpenEvent(event)}
                                            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-[#1E2761] text-white rounded-2xl font-bold text-sm sm:text-base transition-all hover:bg-[#2d3a7d] hover:shadow-xl hover:-translate-y-0.5 w-full"
                                        >
                                            View Details
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-100 text-gray-400 rounded-2xl font-bold text-sm sm:text-base cursor-not-allowed w-full">
                                            No Link Available
                                        </button>
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
                );
            })()}

            {/* View Event Modal */}
            {viewEventModalOpen && viewingEvent && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="bg-[#1E2761] p-6 sm:p-8 relative shrink-0">
                            <button
                                onClick={() => setViewEventModalOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    <Icons.Events />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                        {viewingEvent.event_name}
                                    </h2>
                                    {viewingEvent.event_host && (
                                        <p className="text-blue-200 font-medium">
                                            Hosted by {viewingEvent.event_host}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-gray-50/50">
                            <div className="space-y-6">
                                {/* Description */}
                                {viewingEvent.event_description && (
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                                            About Event
                                        </h3>
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {viewingEvent.event_description}
                                        </p>
                                    </div>
                                )}

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                Event Date
                                            </h3>
                                            <p className="font-bold text-gray-900">
                                                {formatEventDate(viewingEvent.event_time)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                Registration Deadline
                                            </h3>
                                            <p className="font-bold text-gray-900">
                                                {formatEventDate(viewingEvent.event_reg_deadline)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Self Report Participation */}
                                {canSelfReportParticipation && (
                                    <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm bg-emerald-50/10">
                                        <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-4">
                                            Update Participation Status
                                        </h3>
                                        {(() => {
                                            const currentStatus = participationByEvent[viewingEvent.$id]?.status;
                                            return (
                                                <>
                                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                                        <p className="text-sm font-bold text-gray-600">
                                                            Your Current Status:
                                                        </p>
                                                        <span
                                                            className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${getStatusBadgeClass(currentStatus)}`}
                                                        >
                                                            {getStatusLabel(currentStatus)}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleParticipationChange(viewingEvent.$id, PARTICIPATION_STATUS.PARTICIPATED)}
                                                            disabled={
                                                                savingParticipationFor === viewingEvent.$id ||
                                                                currentStatus === PARTICIPATION_STATUS.PARTICIPATED
                                                            }
                                                            className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${getParticipationButtonClass(currentStatus, PARTICIPATION_STATUS.PARTICIPATED)} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                        >
                                                            Mark Participated
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleParticipationChange(viewingEvent.$id, PARTICIPATION_STATUS.NOT_PARTICIPATED)}
                                                            disabled={
                                                                savingParticipationFor === viewingEvent.$id ||
                                                                currentStatus === PARTICIPATION_STATUS.NOT_PARTICIPATED
                                                            }
                                                            className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${getParticipationButtonClass(currentStatus, PARTICIPATION_STATUS.NOT_PARTICIPATED)} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                        >
                                                            Mark Not Participated
                                                        </button>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Link Section */}
                                {viewingEvent.event_url && (
                                    <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm bg-blue-50/30">
                                        <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-4 text-center">
                                            Ready to participate?
                                        </h3>
                                        <Link
                                            href={viewingEvent.event_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setViewEventModalOpen(false)}
                                            className="flex items-center justify-center gap-3 px-8 py-4 bg-[#1E2761] text-white rounded-xl font-bold text-lg hover:bg-[#2d3a7d] hover:shadow-lg transition-all active:scale-95 w-full"
                                        >
                                            Visit Event Destination
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
