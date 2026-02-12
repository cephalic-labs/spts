"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getEvents } from "@/lib/services/eventService";
import { getStudentEventParticipations, PARTICIPATION_STATUS } from "@/lib/services/eventParticipationService";
import { createODRequest } from "@/lib/services/odRequestService";
import { getStudentByAppwriteUserId, getStudentByEmail } from "@/lib/services/studentService";

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
    const [participatedEventIds, setParticipatedEventIds] = useState(new Set());
    const [formError, setFormError] = useState("");

    const [formData, setFormData] = useState({
        event_id: "",
        od_start_date: "",
        od_end_date: "",
        reason: "",
    });

    useEffect(() => {
        if (isOpen) {
            setFormError("");
            loadEvents();
            loadStudentInfo();
            loadParticipationInfo();
        }
    }, [isOpen]);

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

            let student = null;

            if (user.email) {
                student = await getStudentByEmail(user.email);
            }
            if (!student && user.$id) {
                student = await getStudentByAppwriteUserId(user.$id);
            }

            setStudentData(student);
        } catch (error) {
            console.error("Error loading student info:", error);
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

    const selectedEvent = events.find((event) => event.$id === formData.event_id) || null;
    const selectedEventDate = normalizeDateOnly(selectedEvent?.event_time);
    const participatedEvents = events.filter((event) => participatedEventIds.has(event.$id));
    const canSubmit = Boolean(studentData) && participatedEvents.length > 0;

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
        if (selectedEventDate && (formData.od_start_date > selectedEventDate || formData.od_end_date > selectedEventDate)) {
            setFormError("OD dates must be on or before the selected event date.");
            return;
        }

        try {
            setLoading(true);

            await createODRequest({
                ...formData,
                student_id: user?.$id,
                student_email: user?.email || null,
            });

            onSuccess();
            onClose();
            // Reset form
            setFormData({
                event_id: "",
                od_start_date: "",
                od_end_date: "",
                reason: "",
            });
        } catch (error) {
            console.error("Error creating OD request:", error);
            setFormError(error?.message || "Failed to submit OD request");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-[#1E2761]">New OD Request</h2>
                        <p className="text-gray-400 text-sm font-medium">Submit a request for attendance leave</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Select Event</label>
                        <select
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                            value={formData.event_id}
                            onChange={(e) => setFormData({ ...formData, event_id: e.target.value, od_start_date: "", od_end_date: "" })}
                        >
                            <option value="">
                                {fetchingParticipation
                                    ? "Loading participation..."
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Start Date</label>
                            <input
                                required
                                type="date"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                                value={formData.od_start_date}
                                onChange={(e) => setFormData({ ...formData, od_start_date: e.target.value })}
                                max={selectedEventDate || undefined}
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
                                max={selectedEventDate || undefined}
                            />
                        </div>
                    </div>

                    {selectedEventDate && (
                        <p className="text-xs text-gray-500 -mt-2">
                            Selected event date: <span className="font-bold text-gray-700">{selectedEventDate}</span>. OD dates must be on or before this date.
                        </p>
                    )}

                    {!studentData && !fetchingParticipation && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            Student profile not found. Please contact your advisor/coordinator before submitting OD.
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

                    {formError && (
                        <p className="text-sm font-medium text-red-600">{formError}</p>
                    )}

                    <div className="pt-4 flex gap-3">
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
                            className="flex-[2] px-6 py-4 bg-[#1E2761] text-white font-bold rounded-2xl hover:bg-[#2d3a7d] transition-all shadow-lg shadow-[#1E2761]/20 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Submitting..." : "Submit Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
