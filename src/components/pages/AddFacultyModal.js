"use client";

import { useState, useEffect } from "react";
import { createFaculty, updateFaculty } from "@/lib/services/facultyService";

export default function AddFacultyModal({ isOpen, onClose, onSuccess, initialData = null, preselectedRole = null }) {
    const isEdit = !!initialData;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        department: "",
        designation: "",
        role: "mentor",
        assigned_sections: "", // Store as string for input, convert to array for save
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                email: initialData.email || "",
                department: initialData.department || "",
                designation: initialData.designation || "",
                role: initialData.role || preselectedRole || "mentor",
                assigned_sections: (initialData.assigned_sections || []).join(", "),
            });
        } else {
            setFormData({
                name: "",
                email: "",
                department: "",
                designation: "",
                role: preselectedRole || "mentor",
                assigned_sections: "",
            });
        }
    }, [initialData, isOpen, preselectedRole]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const dataToSave = {
                ...formData,
                assigned_sections: formData.assigned_sections.split(",").map(s => s.trim()).filter(s => s),
            };

            if (isEdit) {
                await updateFaculty(initialData.$id, dataToSave);
            } else {
                await createFaculty(dataToSave);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving faculty:", error);
            alert("Failed to save faculty record");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-4 sm:p-8 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-[#1E2761]">{isEdit ? "Edit Faculty" : "Add New Faculty"}</h2>
                        <p className="text-gray-400 text-sm font-medium">Register department staff and roles</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 max-h-[calc(90vh-110px)] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email</label>
                            <input
                                required
                                type="email"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Department</label>
                            <select
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            >
                                <option value="">Select Dept</option>
                                <option value="CSE">CSE</option>
                                <option value="ECE">ECE</option>
                                <option value="EEE">EEE</option>
                                <option value="MECH">MECH</option>
                                <option value="IT">IT</option>
                                <option value="AIDS">AIDS</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Designation</label>
                            <input
                                required
                                type="text"
                                placeholder="Assistant Professor"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                                value={formData.designation}
                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Portal Role</label>
                            <select
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium font-bold text-orange-600"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="mentor">Mentor</option>
                                <option value="advisor">Advisor</option>
                                <option value="coordinator">Coordinator</option>
                                <option value="hod">HOD</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Assigned Sections</label>
                            <input
                                type="text"
                                placeholder="A, B, C (comma separated)"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                                value={formData.assigned_sections}
                                onChange={(e) => setFormData({ ...formData, assigned_sections: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
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
                            className="sm:flex-[2] px-6 py-4 bg-[#1E2761] text-white font-bold rounded-2xl hover:bg-[#2d3a7d] transition-all shadow-lg shadow-[#1E2761]/20 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Saving..." : isEdit ? "Update Record" : "Register Faculty"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
