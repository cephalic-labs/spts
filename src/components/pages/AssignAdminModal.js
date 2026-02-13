"use client";

import { useState, useEffect } from "react";
import { getFaculties, updateFaculty } from "@/lib/services/facultyService";
import { Icons } from "@/components/layout";

export default function AssignAdminModal({ isOpen, onClose, onSuccess }) {
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [assigningId, setAssigningId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadFaculty();
            setSearchQuery("");
        }
    }, [isOpen]);

    async function loadFaculty() {
        try {
            setLoading(true);
            // Fetch all faculty. Filtering for non-admins is done client-side for simplicity
            // or we could add a "role not equal" query if supported/needed.
            const response = await getFaculties({}, 1000); 
            // Filter out existing admins
            const nonAdmins = (response.documents || []).filter(f => f.role !== "admin" && f.role !== "sudo");
            setFaculty(nonAdmins);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleAssign = async (member) => {
        if (!window.confirm(`Are you sure you want to promote ${member.name} to Admin?`)) return;

        try {
            setAssigningId(member.$id);
            await updateFaculty(member.$id, { role: "admin" });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error assigning admin role:", error);
            alert("Failed to assign admin role");
        } finally {
            setAssigningId(null);
        }
    };

    const filteredFaculty = faculty.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl h-[85vh] sm:h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-[#1E2761]">Assign Existing Admin</h2>
                        <p className="text-gray-400 text-sm font-medium">Select a faculty member to promote</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-3 sm:p-4 border-b border-gray-100">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E2761]/20 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                    {loading ? (
                        <div className="flex justify-center p-10">
                             <div className="animate-spin w-8 h-8 border-4 border-[#1E2761] border-t-transparent rounded-full"></div>
                        </div>
                    ) : filteredFaculty.length === 0 ? (
                        <div className="text-center p-10 text-gray-400">
                            No eligible faculty found.
                        </div>
                    ) : (
                        filteredFaculty.map(member => (
                            <div key={member.$id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all group">
                                <div>
                                    <div className="font-bold text-gray-800">{member.name}</div>
                                    <div className="text-xs text-gray-400 flex flex-wrap gap-2">
                                        <span>{member.email}</span>
                                        <span>•</span>
                                        <span className="uppercase text-[#1E2761] font-bold">{member.department}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAssign(member)}
                                    disabled={assigningId === member.$id}
                                    className="w-full sm:w-auto px-4 py-2 bg-[#1E2761]/5 text-[#1E2761] font-bold text-sm rounded-lg hover:bg-[#1E2761] hover:text-white transition-colors disabled:opacity-50"
                                >
                                    {assigningId === member.$id ? "Assigning..." : "Promote"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
