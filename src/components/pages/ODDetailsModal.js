"use client";

import { useState, useEffect } from "react";
import { getODRequestById, getApprovalLogsByODId } from "@/lib/services/odRequestService";
import { OD_STATUS } from "@/lib/dbConfig";

const statusColors = {
    [OD_STATUS.PENDING_MENTOR]: "bg-yellow-100 text-yellow-700",
    [OD_STATUS.PENDING_ADVISOR]: "bg-yellow-100 text-yellow-700",
    [OD_STATUS.PENDING_COORDINATOR]: "bg-orange-100 text-orange-700",
    [OD_STATUS.PENDING_HOD]: "bg-blue-100 text-blue-700",
    [OD_STATUS.GRANTED]: "bg-green-100 text-green-700",
    [OD_STATUS.APPROVED]: "bg-green-100 text-green-700",
    [OD_STATUS.REJECTED]: "bg-red-100 text-red-700",
};

export default function ODDetailsModal({ isOpen, onClose, odId }) {
    const [odRequest, setOdRequest] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && odId) {
            loadDetails();
        }
    }, [isOpen, odId]);

    async function loadDetails() {
        try {
            setLoading(true);
            const data = await getODRequestById(odId);
            setOdRequest(data);

            const logsData = await getApprovalLogsByODId(odId);
            setLogs(logsData.documents || []);
        } catch (error) {
            console.error("Error loading OD details:", error);
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-[#1E2761]">OD Request Details</h2>
                        <p className="text-gray-400 text-sm font-medium">#{odId?.slice(0, 8)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-[#1E2761] border-t-transparent rounded-full"></div>
                        </div>
                    ) : odRequest ? (
                        <div className="space-y-8">
                            {/* Status Header */}
                            <div className="flex items-center justify-between bg-gray-50 p-6 rounded-2xl">
                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Current Status</div>
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${statusColors[odRequest.current_status] || "bg-gray-100 text-gray-700"}`}>
                                        {String(odRequest.current_status || "pending").replace(/_/g, " ")}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Final Decision</div>
                                    <span className={`text-xs font-black uppercase ${(odRequest.final_decision === 'approved' || odRequest.final_decision === 'granted') ? 'text-green-600' : odRequest.final_decision === 'rejected' ? 'text-red-600' : 'text-gray-500'}`}>
                                        {odRequest.final_decision || 'Pending'}
                                    </span>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Event</h4>
                                    <p className="font-bold text-[#1E2761]">{odRequest.event_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Duration</h4>
                                    <p className="font-bold text-[#1E2761]">
                                        {new Date(odRequest.od_start_date).toLocaleDateString()} - {new Date(odRequest.od_end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Reason</h4>
                                    <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{odRequest.reason}</p>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Approval Timeline</h4>
                                <div className="space-y-6">
                                    {logs.length === 0 ? (
                                        <p className="text-gray-400 italic text-sm">No activity recorded yet.</p>
                                    ) : (
                                        logs.map((log, idx) => (
                                            <div key={log.$id} className="relative flex gap-4">
                                                {idx !== logs.length - 1 && (
                                                    <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-gray-100"></div>
                                                )}
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${log.action === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {log.action === 'approve' ? (
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                                    ) : (
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-sm text-[#1E2761] capitalize">{log.action_by_role}</span>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${log.action === 'approve' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {log.action === 'approve' ? 'Approved' : 'Rejected'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-1">{log.remarks || 'No remarks'}</p>
                                                    <div className="text-[10px] text-gray-400 font-medium">
                                                        {new Date(log.action_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            Failed to load OD request data.
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-[#1E2761] text-white font-bold rounded-xl hover:bg-[#2d3a7d] transition-all active:scale-95"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
