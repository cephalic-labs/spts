"use client";

import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";

import { getODRequestById, getApprovalLogsByODId } from "@/lib/services/odRequestService";
import { getEventById } from "@/lib/services/eventService";
import { getStudentByAppwriteUserId, getStudentByEmail, getStudentByRollNo } from "@/lib/services/studentService";
import { getFacultyById, getFacultyByFacultyId, getFacultyByAppwriteId, getFacultyByEmail } from "@/lib/services/facultyService";
import { getUserByAppwriteId } from "@/lib/services/userService";
import { OD_STATUS } from "@/lib/dbConfig";

const statusColors = {
    [OD_STATUS.PENDING_MENTOR]: "bg-yellow-100 text-yellow-700",
    [OD_STATUS.PENDING_ADVISOR]: "bg-yellow-100 text-yellow-700",
    [OD_STATUS.PENDING_COORDINATOR]: "bg-orange-100 text-orange-700",
    [OD_STATUS.PENDING_HOD]: "bg-blue-100 text-blue-700",
    [OD_STATUS.GRANTED]: "bg-green-100 text-green-700",
    [OD_STATUS.APPROVED]: "bg-green-100 text-green-700",
    [OD_STATUS.REJECTED]: "bg-red-100 text-red-700",
    [OD_STATUS.CANCELLED]: "bg-gray-100 text-gray-700",
};

// The 4-step approval pipeline
const APPROVAL_STEPS = [
    { key: "mentor", label: "Mentor", statusField: "mentor_status", remarksField: "mentor_remarks", actionAtField: "mentor_action_at", pendingStatus: OD_STATUS.PENDING_MENTOR },
    { key: "advisor", label: "Advisor", statusField: "advisor_status", remarksField: "advisor_remarks", actionAtField: "advisor_action_at", pendingStatus: OD_STATUS.PENDING_ADVISOR },
    { key: "coordinator", label: "Coordinator", statusField: "coordinator_status", remarksField: "coordinator_remarks", actionAtField: "coordinator_action_at", pendingStatus: OD_STATUS.PENDING_COORDINATOR },
    { key: "hod", label: "HOD", statusField: "hod_status", remarksField: "hod_remarks", actionAtField: "hod_action_at", pendingStatus: OD_STATUS.PENDING_HOD },
];

// Pipeline order definition
const PIPELINE_ORDER = [
    OD_STATUS.PENDING_MENTOR,
    OD_STATUS.PENDING_ADVISOR,
    OD_STATUS.PENDING_COORDINATOR,
    OD_STATUS.PENDING_HOD,
    OD_STATUS.GRANTED,
    OD_STATUS.APPROVED
];

function getStepState(odRequest, step) {
    if (!odRequest) return "waiting";

    // 1. Check explicit status if available
    const stepStatus = odRequest[step.statusField];
    if (stepStatus === "approved") return "approved";
    if (stepStatus === "rejected") return "rejected";

    // 2. Check current status match
    if (odRequest.current_status === step.pendingStatus) return "current";

    // 3. Infer "approved" based on pipeline position
    // If request status is later in the pipeline than this step's pending status, 
    // we can assume this step was approved.
    const currentIndex = PIPELINE_ORDER.indexOf(odRequest.current_status);
    const stepIndex = PIPELINE_ORDER.indexOf(step.pendingStatus);

    if (currentIndex > stepIndex) return "approved";

    // 4. Handle Rejected case slightly differently?
    // If rejected, we typically reset or just show the rejection banner.
    // The individual step circles will stay "waiting" unless explicitly marked rejected.

    return "waiting";
}

function getLogActionMeta(action) {
    if (action === "approve") {
        return {
            label: "Approved",
            iconClass: "bg-green-100 text-green-600",
            badgeClass: "text-green-600",
        };
    }

    if (action === "cancel") {
        return {
            label: "Cancelled",
            iconClass: "bg-amber-100 text-amber-700",
            badgeClass: "text-amber-700",
        };
    }

    return {
        label: "Rejected",
        iconClass: "bg-red-100 text-red-600",
        badgeClass: "text-red-600",
    };
}

export default function ODDetailsModal({ isOpen, onClose, odId }) {
    const [odRequest, setOdRequest] = useState(null);
    const [logs, setLogs] = useState([]);
    const [eventDetails, setEventDetails] = useState(null);
    const [studentDetails, setStudentDetails] = useState(null);
    const [submitterEmail, setSubmitterEmail] = useState("");
    const [advisorName, setAdvisorName] = useState("N/A");
    const [logUsers, setLogUsers] = useState({});
    const [teamMembersData, setTeamMembersData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const printRef = useRef(null);

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

            // Prefer querying sece-students by submitter email (more reliable than appwrite_user_id in some setups).
            const resolveSubmitterEmail = async (odRequestData) => {
                if (!odRequestData) return "";
                if (odRequestData.student_email && odRequestData.student_email.includes("@")) {
                    return odRequestData.student_email;
                }
                if (odRequestData.student_id && odRequestData.student_id.includes("@")) {
                    return odRequestData.student_id;
                }
                if (!odRequestData.student_id) return "";

                const dbUser = await getUserByAppwriteId(odRequestData.student_id).catch(() => null);
                return dbUser?.user_email || "";
            };

            const resolvedEmail = await resolveSubmitterEmail(data);
            setSubmitterEmail(resolvedEmail || "");

            let studentData = null;
            if (resolvedEmail) {
                studentData = await getStudentByEmail(resolvedEmail).catch(() => null);
            }
            if (!studentData && data.student_id) {
                studentData = await getStudentByAppwriteUserId(data.student_id).catch(() => null);
            }

            const [logsData, eventData] = await Promise.all([
                getApprovalLogsByODId(odId),
                data.event_id ? getEventById(data.event_id).catch(() => null) : Promise.resolve(null),
            ]);

            const logsDocs = logsData.documents || [];

            // Resolve Log Users
            const userIdsToResolve = [...new Set(logsDocs.map(log => log.action_by_user_id).filter(Boolean))];
            const logUsersMap = {};
            await Promise.all(userIdsToResolve.map(async (uid) => {
                let fac = await getFacultyByAppwriteId(uid).catch(() => null);
                let dbUser = null;
                if (!fac) {
                    dbUser = await getUserByAppwriteId(uid).catch(() => null);
                    if (dbUser && dbUser.user_email) {
                        fac = await getFacultyByEmail(dbUser.user_email).catch(() => null);
                    }
                }

                if (fac) {
                    logUsersMap[uid] = { name: fac.name, department: fac.department || "" };
                } else if (dbUser) {
                    logUsersMap[uid] = { name: dbUser.user_name || dbUser.name || "Unknown", department: "" };
                } else {
                    logUsersMap[uid] = { name: "Unknown", department: "" };
                }
            }));

            let resolvedAdvisorName = "N/A";
            if (studentData?.advisor_id) {
                const docIdMatch = await getFacultyById(studentData.advisor_id).catch(() => null);
                const facIdMatch = docIdMatch ? null : await getFacultyByFacultyId(studentData.advisor_id).catch(() => null);
                const appwriteIdMatch = (docIdMatch || facIdMatch) ? null : await getFacultyByAppwriteId(studentData.advisor_id).catch(() => null);

                const matchedFac = docIdMatch || facIdMatch || appwriteIdMatch;
                if (matchedFac) {
                    resolvedAdvisorName = matchedFac.department ? `${matchedFac.name} (${matchedFac.department})` : matchedFac.name;
                } else {
                    resolvedAdvisorName = studentData.advisor_id;
                }
            }

            setLogs(logsDocs);
            setEventDetails(eventData);
            setStudentDetails(studentData);
            setAdvisorName(resolvedAdvisorName);
            setLogUsers(logUsersMap);

            // Resolve team members
            const teamRolls = data.team || [];
            if (teamRolls.length > 0) {
                const teamResults = await Promise.all(
                    teamRolls.map(async (rollNo) => {
                        try {
                            const member = await getStudentByRollNo(rollNo);
                            return member || { roll_no: rollNo, name: rollNo };
                        } catch {
                            return { roll_no: rollNo, name: rollNo };
                        }
                    })
                );
                setTeamMembersData(teamResults);
            } else {
                setTeamMembersData([]);
            }
        } catch (error) {
            console.error("Error loading OD details:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleDownloadPDF = async () => {
        try {
            setIsDownloading(true);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidth = pageWidth - margin * 2;
            let y = margin;

            // Helper functions
            const drawLine = (x1, y1, x2, y2, width = 0.3, color = [0, 0, 0]) => {
                pdf.setDrawColor(...color);
                pdf.setLineWidth(width);
                pdf.line(x1, y1, x2, y2);
            };

            const addText = (text, x, yPos, options = {}) => {
                const { fontSize = 10, fontStyle = 'normal', maxWidth, color = [0, 0, 0], align = 'left' } = options;
                pdf.setFontSize(fontSize);
                pdf.setFont('helvetica', fontStyle);
                pdf.setTextColor(...color);
                
                const textStr = String(text || '');
                if (maxWidth) {
                    pdf.text(textStr, x, yPos, { maxWidth, align });
                } else {
                    pdf.text(textStr, x, yPos, { align });
                }
            };

            const checkPageBreak = (requiredHeight) => {
                if (y + requiredHeight > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                    return true;
                }
                return false;
            };

            // === HEADER ===
            addText('Sri Eshwar College of Engineering', pageWidth / 2, y, {
                fontSize: 16, fontStyle: 'bold', align: 'center'
            });
            y += 6;

            addText('Outward Duty (OD) Approval Form', pageWidth / 2, y, {
                fontSize: 12, fontStyle: 'bold', align: 'center'
            });
            y += 4;

            // Header line
            drawLine(margin, y, pageWidth - margin, y, 0.5);
            y += 10;

            // === STUDENT INFORMATION & EVENT INFORMATION SIDE BY SIDE ===
            const colWidth = (contentWidth - 6) / 2;
            const infoBoxHeight = 45;
            const boxStartY = y;

            // Student Info Box
            pdf.setDrawColor(0);
            pdf.setLineWidth(0.3);
            pdf.rect(margin, boxStartY, colWidth, infoBoxHeight);

            addText('STUDENT INFORMATION', margin + 3, boxStartY + 6, { fontSize: 9, fontStyle: 'bold' });
            drawLine(margin + 3, boxStartY + 8, margin + colWidth - 3, boxStartY + 8, 0.2);

            let sy = boxStartY + 14;
            const labelX = margin + 3;
            const valueX = margin + 28;
            
            addText('Name:', labelX, sy, { fontSize: 8, fontStyle: 'bold' });
            addText(studentDetails?.name, valueX, sy, { fontSize: 8 });
            sy += 6;
            addText('Roll No:', labelX, sy, { fontSize: 8, fontStyle: 'bold' });
            addText(studentDetails?.roll_no || studentDetails?.student_register_no, valueX, sy, { fontSize: 8 });
            sy += 6;
            addText('Department:', labelX, sy, { fontSize: 8, fontStyle: 'bold' });
            addText(studentDetails?.department, valueX, sy, { fontSize: 8 });
            sy += 6;
            addText('Year / Sec:', labelX, sy, { fontSize: 8, fontStyle: 'bold' });
            addText(`${studentDetails?.year || 'N/A'} / ${studentDetails?.section || 'N/A'}`, valueX, sy, { fontSize: 8 });
            sy += 6;
            addText('Advisor:', labelX, sy, { fontSize: 8, fontStyle: 'bold' });
            addText(advisorName, valueX, sy, { fontSize: 8, maxWidth: colWidth - 30 });

            // Event Info Box
            const eventX = margin + colWidth + 6;
            pdf.rect(eventX, boxStartY, colWidth, infoBoxHeight);

            addText('EVENT INFORMATION', eventX + 3, boxStartY + 6, { fontSize: 9, fontStyle: 'bold' });
            drawLine(eventX + 3, boxStartY + 8, eventX + colWidth - 3, boxStartY + 8, 0.2);

            let ey = boxStartY + 14;
            const eLabelX = eventX + 3;
            const eValueX = eventX + 28;

            addText('Event:', eLabelX, ey, { fontSize: 8, fontStyle: 'bold' });
            addText(eventDetails?.event_name || odRequest?.event_id, eValueX, ey, { fontSize: 8, maxWidth: colWidth - 30 });
            ey += 10;
            addText('Start Date:', eLabelX, ey, { fontSize: 8, fontStyle: 'bold' });
            addText(odRequest?.od_start_date ? new Date(odRequest.od_start_date).toLocaleDateString('en-IN') : 'N/A', eValueX, ey, { fontSize: 8 });
            ey += 6;
            addText('End Date:', eLabelX, ey, { fontSize: 8, fontStyle: 'bold' });
            addText(odRequest?.od_end_date ? new Date(odRequest.od_end_date).toLocaleDateString('en-IN') : 'N/A', eValueX, ey, { fontSize: 8 });
            ey += 6;
            const days = (() => {
                if (!odRequest?.od_start_date || !odRequest?.od_end_date) return 0;
                const s = new Date(odRequest.od_start_date); s.setHours(0,0,0,0);
                const e = new Date(odRequest.od_end_date); e.setHours(0,0,0,0);
                return Math.round((e - s) / (1000*60*60*24)) + 1;
            })();
            addText('Duration:', eLabelX, ey, { fontSize: 8, fontStyle: 'bold' });
            addText(`${days} Day${days === 1 ? '' : 's'}`, eValueX, ey, { fontSize: 8 });

            y = boxStartY + infoBoxHeight + 8;

            // === REASON ===
            const reasonText = odRequest?.reason || 'N/A';
            const reasonLines = pdf.splitTextToSize(reasonText, contentWidth - 8);
            const reasonBoxHeight = Math.max(25, 12 + reasonLines.length * 4);
            
            checkPageBreak(reasonBoxHeight);
            pdf.rect(margin, y, contentWidth, reasonBoxHeight);
            addText('REASON FOR OUTWARD DUTY', margin + 3, y + 6, { fontSize: 9, fontStyle: 'bold' });
            drawLine(margin + 3, y + 8, margin + contentWidth - 3, y + 8, 0.2);
            
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            pdf.text(reasonLines, margin + 3, y + 14);
            y += reasonBoxHeight + 8;

            // === TEAM MEMBERS ===
            if (teamMembersData.length > 0) {
                const teamBoxHeight = 12 + Math.ceil(teamMembersData.length / 2) * 5;
                checkPageBreak(teamBoxHeight);
                pdf.rect(margin, y, contentWidth, teamBoxHeight);
                addText(`TEAM MEMBERS (${teamMembersData.length})`, margin + 3, y + 6, { fontSize: 9, fontStyle: 'bold' });
                drawLine(margin + 3, y + 8, margin + contentWidth - 3, y + 8, 0.2);

                let ty = y + 13;
                teamMembersData.forEach((member, idx) => {
                    const col = idx % 2 === 0 ? margin + 3 : margin + colWidth + 6;
                    if (idx > 0 && idx % 2 === 0) ty += 5;
                    const memberText = `${idx + 1}. ${member.name || member.roll_no}${member.roll_no ? ` (${member.roll_no})` : ''}`;
                    addText(memberText, col, ty, { fontSize: 7, maxWidth: colWidth - 5 });
                });
                y += teamBoxHeight + 8;
            }

            // === AUTHORIZATION / DIGITAL SIGNATURES ===
            checkPageBreak(50);
            addText('AUTHORIZATION / DIGITAL SIGNATURES', margin, y, { fontSize: 10, fontStyle: 'bold' });
            y += 6;

            const sigColWidth = (contentWidth - 9) / 4;
            APPROVAL_STEPS.forEach((step, idx) => {
                const state = getStepState(odRequest, step);
                const actionAt = odRequest[step.actionAtField];
                const logForStep = logs.find(l => l.action_by_role === step.key && l.action === "approve");
                const facName = logForStep && logUsers[logForStep.action_by_user_id]
                    ? `${logUsers[logForStep.action_by_user_id].name}${logUsers[logForStep.action_by_user_id].department ? ` (${logUsers[logForStep.action_by_user_id].department.toUpperCase()})` : ''}`
                    : null;

                const sx = margin + idx * (sigColWidth + 3);
                pdf.setDrawColor(0);
                pdf.setLineWidth(0.3);
                pdf.rect(sx, y, sigColWidth, 35);

                // Step label (matching print-container style)
                addText(step.label.toUpperCase(), sx + sigColWidth / 2, y + 5, { 
                    fontSize: 7, 
                    fontStyle: 'bold', 
                    color: [30, 39, 97],
                    align: 'center'
                });
                drawLine(sx + 2, y + 7, sx + sigColWidth - 2, y + 7, 0.1, [200, 200, 200]);

                if (state === "approved") {
                    addText('APPROVED', sx + sigColWidth / 2, y + 14, { 
                        fontSize: 7, 
                        fontStyle: 'bold', 
                        color: [21, 128, 61],
                        align: 'center'
                    });
                    if (facName) {
                        const nameLines = pdf.splitTextToSize(facName, sigColWidth - 4);
                        addText(nameLines, sx + sigColWidth / 2, y + 20, {
                            fontSize: 6,
                            fontStyle: 'bold',
                            color: [50, 50, 50],
                            align: 'center'
                        });
                    }
                    if (actionAt) {
                        addText(new Date(actionAt).toLocaleString('en-IN'), sx + sigColWidth / 2, y + 31, { 
                            fontSize: 5, 
                            color: [120, 120, 120],
                            align: 'center'
                        });
                    }
                } else {
                    addText('Awaiting', sx + sigColWidth / 2, y + 20, { 
                        fontSize: 8, 
                        fontStyle: 'italic', 
                        color: [180, 180, 180],
                        align: 'center'
                    });
                }
            });

            y += 45;

            // === FOOTER ===
            checkPageBreak(15);
            drawLine(margin, y, pageWidth - margin, y, 0.2, [200, 200, 200]);
            y += 5;
            const footerText = 'This is a digitally generated document via Sri Eshwar Student Participation Tracking System (SPTS).';
            const footerText2 = 'No physical signature is required.';
            addText(footerText, pageWidth / 2, y, { fontSize: 6, color: [150, 150, 150], align: 'center' });
            y += 3;
            addText(footerText2, pageWidth / 2, y, { fontSize: 6, color: [150, 150, 150], align: 'center' });

            // Save
            pdf.save(`OD_Form_${odRequest?.student_roll_no || studentDetails?.roll_no || 'Request'}_${odId?.slice(0, 8)}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to download PDF. Please try again or use the Print option.");
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isOpen) return null;

    const isGranted = odRequest?.current_status === OD_STATUS.GRANTED || odRequest?.current_status === OD_STATUS.APPROVED;
    const isRejected = odRequest?.current_status === OD_STATUS.REJECTED;
    const isCancelled = odRequest?.current_status === OD_STATUS.CANCELLED;

    const calculateDays = () => {
        if (!odRequest?.od_start_date || !odRequest?.od_end_date) return 0;
        const start = new Date(odRequest.od_start_date);
        const end = new Date(odRequest.od_end_date);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    };
    const odDays = calculateDays();

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
                <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="p-4 sm:p-8 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-[#1E2761]">OD Request Details</h2>
                            <p className="text-gray-400 text-sm font-medium">#{odId?.slice(0, 8)}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-4 sm:p-8 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin w-8 h-8 border-4 border-[#1E2761] border-t-transparent rounded-full"></div>
                            </div>
                        ) : odRequest ? (
                            <div className="space-y-8">
                                {/* Final Status Banner */}
                                {isGranted && (
                                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-black text-green-700 mb-1">OD Granted! 🎉</h3>
                                        <p className="text-green-600 text-sm">Your OD request has been approved by all approvers.</p>
                                    </div>
                                )}
                                {isRejected && (
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-black text-red-700 mb-1">OD Rejected</h3>
                                        <p className="text-red-600 text-sm">Your OD request was rejected. See details below.</p>
                                    </div>
                                )}
                                {isCancelled && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6l-12 12" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-black text-gray-700 mb-1">OD Cancelled</h3>
                                        <p className="text-gray-600 text-sm">This OD request was cancelled by the student.</p>
                                    </div>
                                )}

                                {/* Approval Progress Tracker */}
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Approval Progress</h4>
                                    <div className="overflow-x-auto">
                                        <div className="relative min-w-[520px]">
                                            {/* Progress line */}
                                            <div className="absolute top-5 left-5 right-5 h-[2px] bg-gray-200 z-0"></div>
                                            <div className="relative flex justify-between z-10">
                                                {APPROVAL_STEPS.map((step, idx) => {
                                                    const state = getStepState(odRequest, step);
                                                    const actionAt = odRequest[step.actionAtField];
                                                    const remarks = odRequest[step.remarksField];

                                                    return (
                                                        <div key={step.key} className="flex flex-col items-center" style={{ width: '25%' }}>
                                                            {/* Circle */}
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${state === "approved"
                                                                ? "bg-green-500 border-green-500 text-white"
                                                                : state === "rejected"
                                                                    ? "bg-red-500 border-red-500 text-white"
                                                                    : state === "current"
                                                                        ? "bg-white border-[#1E2761] text-[#1E2761] animate-pulse shadow-lg shadow-[#1E2761]/20"
                                                                        : "bg-gray-100 border-gray-200 text-gray-400"
                                                                }`}>
                                                                {state === "approved" ? (
                                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                                    </svg>
                                                                ) : state === "rejected" ? (
                                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                                                                    </svg>
                                                                ) : (
                                                                    <span className="text-xs font-black">{idx + 1}</span>
                                                                )}
                                                            </div>
                                                            {/* Label */}
                                                            <span className={`mt-2 text-xs font-bold text-center ${state === "approved" ? "text-green-600"
                                                                : state === "rejected" ? "text-red-600"
                                                                    : state === "current" ? "text-[#1E2761]"
                                                                        : "text-gray-400"
                                                                }`}>
                                                                {step.label}
                                                            </span>
                                                            {/* Status text */}
                                                            <span className={`text-[10px] mt-0.5 ${state === "approved" ? "text-green-500"
                                                                : state === "rejected" ? "text-red-500"
                                                                    : state === "current" ? "text-yellow-600"
                                                                        : "text-gray-300"
                                                                }`}>
                                                                {state === "approved" ? "Approved"
                                                                    : state === "rejected" ? "Rejected"
                                                                        : state === "current" ? "Awaiting..."
                                                                            : "Pending"}
                                                            </span>
                                                            {/* Timestamp */}
                                                            {actionAt && (
                                                                <span className="text-[9px] text-gray-400 mt-0.5">
                                                                    {new Date(actionAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Final granted step */}
                                            {isGranted && (
                                                <div className="mt-4 text-center">
                                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase tracking-wider">
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                        </svg>
                                                        OD Granted
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Student Details */}
                                <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Student Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Student Name</p>
                                            <p className="text-sm font-bold text-[#1E2761]">{studentDetails?.name || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Roll Number</p>
                                            <p className="text-sm font-bold text-[#1E2761]">
                                                {studentDetails?.roll_no || studentDetails?.student_register_no || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Email</p>
                                            <p className="text-sm font-bold text-[#1E2761] break-all">
                                                {studentDetails?.email || submitterEmail || (odRequest?.student_id?.includes("@") ? odRequest.student_id : "N/A")}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Department</p>
                                            <p className="text-sm font-bold text-[#1E2761]">{studentDetails?.department || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Year</p>
                                            <p className="text-sm font-bold text-[#1E2761]">{studentDetails?.year ?? "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Section</p>
                                            <p className="text-sm font-bold text-[#1E2761]">{studentDetails?.section || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Advisor</p>
                                            <p className="text-sm font-bold text-[#1E2761]">{advisorName || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Team Members Section */}
                                {teamMembersData.length > 0 && (
                                    <div className="bg-purple-50/50 rounded-2xl p-6 border border-purple-100">
                                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4">👥 Team Members ({teamMembersData.length})</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {teamMembersData.map((member, idx) => (
                                                <div key={member.$id || idx} className="flex items-center gap-3 bg-white border border-purple-100 rounded-xl px-4 py-3">
                                                    <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center text-xs font-black shrink-0">
                                                        {member.name?.charAt(0)?.toUpperCase() || "?"}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#1E2761]">{member.name || member.roll_no}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium">
                                                            {member.roll_no}{member.department ? ` • ${member.department}` : ''}{member.year ? ` • ${member.year}Y` : ''}{member.section ? ` ${member.section}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Info Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Event</h4>
                                        <p className="font-bold text-[#1E2761]">{eventDetails?.event_name || odRequest.event_id || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Duration</h4>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-[#1E2761]">
                                                {new Date(odRequest.od_start_date).toLocaleDateString()} - {new Date(odRequest.od_end_date).toLocaleDateString()}
                                            </p>
                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded">
                                                {odDays} {odDays === 1 ? 'Day' : 'Days'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Reason</h4>
                                        <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{odRequest.reason}</p>
                                    </div>
                                </div>

                                {/* Approval Timeline */}
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Approval Timeline</h4>
                                    <div className="space-y-6">
                                        {logs.length === 0 ? (
                                            <p className="text-gray-400 italic text-sm">No activity recorded yet. Waiting for mentor approval.</p>
                                        ) : (
                                            logs.map((log, idx) => (
                                                <div key={log.$id} className="relative flex gap-4">
                                                    {idx !== logs.length - 1 && (
                                                        <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-gray-100"></div>
                                                    )}
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${getLogActionMeta(log.action).iconClass}`}>
                                                        {log.action === 'approve' ? (
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                                        ) : log.action === 'cancel' ? (
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" /></svg>
                                                        ) : (
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-sm text-[#1E2761] capitalize">
                                                                {log.action_by_role}
                                                                {logUsers[log.action_by_user_id]?.name && (
                                                                    <span className="text-gray-500 font-medium ml-1">
                                                                        - {logUsers[log.action_by_user_id].name}
                                                                        {logUsers[log.action_by_user_id].department ? ` (${logUsers[log.action_by_user_id].department.toUpperCase()})` : ''}
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${getLogActionMeta(log.action).badgeClass}`}>
                                                                {getLogActionMeta(log.action).label}
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

                    <div className="p-4 sm:p-8 border-t border-gray-100 flex justify-end shrink-0 gap-4">
                        {isGranted && (
                            <>
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={isDownloading}
                                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDownloading ? (
                                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    )}
                                    {isDownloading ? "Generating..." : "Download PDF"}
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print Form
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-[#1E2761] text-white font-bold rounded-xl hover:bg-[#2d3a7d] transition-all active:scale-95"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>

            {/* Printable Version */}
            {isGranted && odRequest && (
                <div ref={printRef} className="hidden print:block print-container fixed inset-0 w-full h-full bg-white text-black p-12 z-[999999]">
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @media print {
                            @page { margin: 1cm; size: portrait; }
                            
                            /* Hide all elements by default */
                            body * {
                                visibility: hidden !important;
                            }
                            
                            /* Show ONLY the print container and its contents */
                            .print-container, .print-container * {
                                visibility: visible !important;
                            }
                            
                            /* Position the container precisely for physical paper */
                            .print-container {
                                visibility: visible !important;
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 1.5cm !important;
                                background: white !important;
                            }

                            /* Remove URL/Date footers added by browsers */
                            header, footer { display: none !important; }
                        }
                    `}} />

                    {/* Print Title */}
                    <div className="text-center border-b-2 border-black pb-4 mb-8">
                        <h1 className="text-2xl font-black uppercase tracking-tight">Sri Eshwar College of Engineering</h1>
                        <h2 className="text-xl font-bold mt-1">Outward Duty (OD) Approval Form</h2>
                    </div>

                    {/* Print grid */}
                    <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                        {/* Student Info */}
                        <div className="border border-black p-5 rounded">
                            <h3 className="font-bold text-lg mb-4 border-b border-black pb-2 uppercase tracking-wide">Student Information</h3>
                            <div className="space-y-3">
                                <p><span className="font-bold">Name:</span> {studentDetails?.name}</p>
                                <p><span className="font-bold">Roll Number:</span> {studentDetails?.roll_no || studentDetails?.student_register_no}</p>
                                <p><span className="font-bold">Department:</span> {studentDetails?.department}</p>
                                <p><span className="font-bold">Year / Sec:</span> {studentDetails?.year} / {studentDetails?.section}</p>
                                <p><span className="font-bold">Advisor:</span> {advisorName}</p>
                            </div>
                        </div>

                        {/* Event Info */}
                        <div className="border border-black p-5 rounded">
                            <h3 className="font-bold text-lg mb-4 border-b border-black pb-2 uppercase tracking-wide">Event Information</h3>
                            <div className="space-y-3">
                                <p><span className="font-bold">Event Name:</span> {eventDetails?.event_name || odRequest.event_id}</p>
                                <p><span className="font-bold">Start Date:</span> {odRequest.od_start_date ? new Date(odRequest.od_start_date).toLocaleDateString() : 'N/A'}</p>
                                <p><span className="font-bold">End Date:</span> {odRequest.od_end_date ? new Date(odRequest.od_end_date).toLocaleDateString() : 'N/A'}</p>
                                <p><span className="font-bold">Duration:</span> {odDays} Days</p>
                            </div>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="border border-black p-5 rounded mb-8">
                        <h3 className="font-bold text-lg mb-3 uppercase tracking-wide text-gray-800">Reason for Outward Duty</h3>
                        <p className="whitespace-pre-wrap leading-relaxed text-sm">{odRequest.reason}</p>
                    </div>

                    {/* Team Members (Print) */}
                    {teamMembersData.length > 0 && (
                        <div className="border border-black p-5 rounded mb-8">
                            <h3 className="font-bold text-lg mb-3 uppercase tracking-wide text-gray-800">Team Members ({teamMembersData.length})</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {teamMembersData.map((member, idx) => (
                                    <p key={member.$id || idx}>
                                        <span className="font-bold">{idx + 1}.</span> {member.name || member.roll_no}
                                        {member.roll_no ? ` (${member.roll_no})` : ''}
                                        {member.department ? ` - ${member.department}` : ''}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Approval Signatures / Timestamps */}
                    <h3 className="font-bold text-lg mb-4 uppercase tracking-wide text-gray-800">Authorization / Digital Signatures</h3>
                    <div className="grid grid-cols-4 gap-4 text-center">
                        {APPROVAL_STEPS.map((step) => {
                            const state = getStepState(odRequest, step);
                            const actionAt = odRequest[step.actionAtField];
                            const logForStep = logs.find(l => l.action_by_role === step.key && l.action === "approve");
                            const facName = logForStep && logUsers[logForStep.action_by_user_id]
                                ? `${logUsers[logForStep.action_by_user_id].name}${logUsers[logForStep.action_by_user_id].department ? ` (${logUsers[logForStep.action_by_user_id].department.toUpperCase()})` : ''}`
                                : null;

                            return (
                                <div key={step.key} className="border border-black p-3 rounded flex flex-col items-center justify-between min-h-[140px] bg-gray-50/20">
                                    <div className="font-black mb-2 uppercase text-[10px] border-b border-gray-300 w-full pb-1 text-[#1E2761]">{step.label}</div>
                                    {state === "approved" ? (
                                        <>
                                            <div className="text-green-700 font-bold text-xs uppercase mb-1">APPROVED</div>
                                            <div className="font-bold text-[10px] leading-tight mb-1 text-gray-900">{facName || "Verified Approver"}</div>
                                            <div className="text-[8px] text-gray-500 font-medium">
                                                {actionAt ? new Date(actionAt).toLocaleString('en-IN') : ""}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-gray-300 italic font-medium text-xs">Awaiting</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 pt-6 border-t border-gray-200 text-[10px] text-center text-gray-400 font-medium">
                        This is a digitally generated document via Sri Eshwar Student Participation Tracking System (SPTS).
                        No physical signature is required.
                    </div>
                </div>
            )}
        </>
    );
}
