"use client";

import { useState, useEffect } from "react";
import { createDepartment, updateDepartment } from "@/lib/services/departmentService";

export default function AddDepartmentModal({ isOpen, onClose, onSuccess, initialData = null }) {
    const isEdit = !!initialData;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        hod_name: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                hod_name: initialData.hod_name || "",
            });
        } else {
            setFormData({
                name: "",
                hod_name: "",
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (isEdit) {
                await updateDepartment(initialData.$id, formData);
            } else {
                await createDepartment(formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving department:", error);
            alert("Failed to save department record");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-[#1E2761]">{isEdit ? "Edit Department" : "Add Department"}</h2>
                        <p className="text-gray-400 text-sm font-medium">Define organization unit</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Department Name/Code</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. CSE, ECE"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Head of Department (Name)</label>
                        <input
                            required
                            type="text"
                            placeholder="Dr. Name"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                            value={formData.hod_name}
                            onChange={(e) => setFormData({ ...formData, hod_name: e.target.value })}
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
                            {loading ? "Saving..." : isEdit ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
