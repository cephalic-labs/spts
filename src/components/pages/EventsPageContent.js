"use client";

import { useState, useEffect } from "react";
import { getEvents } from "@/lib/services/eventService";
import { Icons } from "@/components/layout";

export default function EventsPageContent({ role }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const canCreateEvent = ["sudo", "admin", "coordinator"].includes(role);

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
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E2761] text-white rounded-xl hover:bg-[#2d3a7d] transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Event
                    </button>
                )}
            </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <div
                            key={event.$id}
                            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group"
                        >
                            {/* Event Image */}
                            <div className="h-40 bg-gradient-to-br from-[#1E2761] to-[#3D4CAB] relative overflow-hidden">
                                {event.event_image_url && (
                                    <img
                                        src={event.event_image_url}
                                        alt={event.event_name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                )}
                                <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 rounded-lg text-xs font-bold text-[#1E2761]">
                                    {event.participation_count || 0} joined
                                </div>
                            </div>

                            {/* Event Details */}
                            <div className="p-5">
                                <h3 className="font-bold text-[#1E2761] text-lg mb-2 line-clamp-1">
                                    {event.event_name}
                                </h3>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                                    {event.event_description}
                                </p>

                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(event.event_time).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {event.view_count || 0} views
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="px-5 pb-5">
                                <button className="w-full py-2.5 bg-[#F8F9FA] hover:bg-[#1E2761] hover:text-white text-[#1E2761] rounded-lg font-medium text-sm transition-colors">
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
