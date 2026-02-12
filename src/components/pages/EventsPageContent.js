"use client";

import { useState, useEffect } from "react";
import { deleteEvent, getEvents } from "@/lib/services/eventService";
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

export default function EventsPageContent({ role }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        loadEvents();
    }, []);

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

    const canCreateEvent = ["sudo", "admin", "coordinator"].includes(role);
    const canManageEvents = ["sudo", "admin"].includes(role);

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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#1E2761]">Events</h1>
                    <p className="text-gray-500 text-sm mt-1">Browse and manage events</p>
                </div>
                {canCreateEvent && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1E2761] text-white rounded-xl hover:bg-[#2d3a7d] transition-colors shadow-sm"
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
                            className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 hover:shadow-md transition-all group flex flex-col md:flex-row gap-6 items-center"
                        >
                            {/* Event Details */}
                            <div className="flex-grow text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                                    <h3 className="font-bold text-[#1E2761] text-2xl">
                                        {event.event_name}
                                    </h3>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 w-fit mx-auto md:mx-0">
                                        {event.participation_count || 0} participants
                                    </span>
                                </div>
                                <p className="text-gray-500 text-base line-clamp-2 mb-6 max-w-3xl">
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
                            <div className="w-full md:w-auto flex flex-col gap-3">
                                {event.event_url ? (
                                    <Link
                                        href={event.event_url}
                                        target="_blank"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1E2761] text-white rounded-2xl font-bold text-base transition-all hover:bg-[#2d3a7d] hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto"
                                    >
                                        Open Event
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </Link>
                                ) : (
                                    <button className="px-8 py-4 bg-gray-100 text-gray-400 rounded-2xl font-bold text-base cursor-not-allowed w-full md:w-auto">
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
            )
            }
        </div>
    );
}
