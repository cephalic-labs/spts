"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getEvents } from "@/lib/services/eventService";
import { createODRequest } from "@/lib/services/odRequestService";
import { getStudentByRegNo } from "@/lib/services/studentService";

export default function CreateODModal({ isOpen, onClose, onSuccess }) {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingEvents, setFetchingEvents] = useState(false);
    const [studentData, setStudentData] = useState(null);

    const [formData, setFormData] = useState({
        event_id: "",
        od_start_date: "",
        od_end_date: "",
        reason: "",
    });

    useEffect(() => {
        if (isOpen) {
            loadEvents();
            loadStudentInfo();
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
            // we might need more metadata for the OD request like mentor_id etc.
            // which should be on the student document
            if (user?.$id || user?.dbId) {
                // For now, let's assume we can find the student by appwrite id or email
                // Using a placeholder approach if student record not fully linked
                // In a real app, this should be in the AuthContext already
            }
        } catch (error) {
            console.error("Error loading student info:", error);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            await createODRequest({
                ...formData,
                student_id: user?.$id || user?.dbId,
                // These IDs should ideally come from the student's record
                mentor_id: null,
                advisor_id: null,
                coordinator_id: null,
                hod_id: null,
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
            alert("Failed to submit OD request");
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
                            onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                        >
                            <option value="">Choose an event...</option>
                            {fetchingEvents ? (
                                <option disabled>Loading events...</option>
                            ) : (
                                events.map(event => (
                                    <option key={event.$id} value={event.$id}>{event.event_name}</option>
                                ))
                            )}
                        </select>
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
                            />
                        </div>
                    </div>

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
                            disabled={loading}
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
