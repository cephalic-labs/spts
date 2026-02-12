"use client";

import { useEffect, useState } from "react";
import { createEvent, updateEvent } from "@/lib/services/eventService";

function formatDateTimeLocal(value) {
    if (!value) return "";
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        return "";
    }

    return parsedDate.toISOString().slice(0, 16);
}

export default function CreateEventModal({ isOpen, onClose, onSuccess, initialData = null }) {
    const isEdit = Boolean(initialData);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        event_name: "",
        event_description: "",
        event_time: "",
        event_reg_deadline: "",
        event_url: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                event_name: initialData.event_name || "",
                event_description: initialData.event_description || "",
                event_time: formatDateTimeLocal(initialData.event_time),
                event_reg_deadline: formatDateTimeLocal(initialData.event_reg_deadline),
                event_url: initialData.event_url || "",
            });
            return;
        }

        setFormData({
            event_name: "",
            event_description: "",
            event_time: "",
            event_reg_deadline: "",
            event_url: "",
        });
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await updateEvent(initialData.$id, formData);
            } else {
                await createEvent(formData);
            }

            onSuccess();
            onClose();
        } catch (error) {
            alert(`Failed to ${isEdit ? "update" : "create"} event. Please try again.`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-[#1E2761]">
                    <h2 className="text-xl font-bold text-white">{isEdit ? "Edit Event" : "Create New Event"}</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Event Name</label>
                        <input
                            required
                            type="text"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1E2761] focus:border-transparent outline-none transition-all"
                            placeholder="Enter event name"
                            value={formData.event_name}
                            onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Description</label>
                        <textarea
                            required
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1E2761] focus:border-transparent outline-none transition-all"
                            placeholder="Describe your event..."
                            value={formData.event_description}
                            onChange={(e) => setFormData({ ...formData, event_description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Event Date & Time</label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1E2761] focus:border-transparent outline-none transition-all"
                                value={formData.event_time}
                                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Registration Deadline</label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1E2761] focus:border-transparent outline-none transition-all"
                                value={formData.event_reg_deadline}
                                onChange={(e) => setFormData({ ...formData, event_reg_deadline: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Event URL / Registration Link</label>
                        <input
                            required
                            type="url"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1E2761] focus:border-transparent outline-none transition-all"
                            placeholder="https://..."
                            value={formData.event_url}
                            onChange={(e) => setFormData({ ...formData, event_url: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading}
                            type="submit"
                            className="flex-1 px-6 py-3 rounded-xl bg-[#1E2761] text-white font-semibold hover:bg-[#2d3a7d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    {isEdit ? "Updating..." : "Creating..."}
                                </>
                            ) : (
                                isEdit ? "Update Event" : "Create Event"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
