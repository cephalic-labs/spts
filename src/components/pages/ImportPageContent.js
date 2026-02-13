"use client";
import { useState, useEffect } from "react";
import { Icons } from "@/components/layout";
import * as XLSX from "xlsx";
import { createStudent } from "@/lib/services/studentService";
import { createFaculty, getFaculties } from "@/lib/services/facultyService";
import { createEvent } from "@/lib/services/eventService";

export default function ImportPageContent({ role }) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [target, setTarget] = useState("Students");
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [advisors, setAdvisors] = useState([]);
    const [selectedAdvisorId, setSelectedAdvisorId] = useState("");

    useEffect(() => {
        const fetchAdvisors = async () => {
            try {
                // Fetch all faculty members who could be advisors/mentors
                const response = await getFaculties({}, 100);
                setAdvisors(response.documents || []);
            } catch (error) {
                console.error("Failed to fetch advisors:", error);
            }
        };
        fetchAdvisors();
    }, []);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const downloadSample = () => {
        let sampleData = [];
        let fileName = "";

        if (target === "Students") {
            sampleData = [
                {
                    "Roll Number": "21CS001",
                    "First Name": "John",
                    "Last Name": "Doe",
                    "Email": "john.doe@sece.ac.in",
                    "Phone": "9876543210",
                    "Department Code": "CSE",
                    "Year": 3,
                    "Section": "A",
                    "CGPA": 8.5
                }
            ];
            fileName = "student_import_sample.xlsx";
        } else if (target === "Faculty") {
            sampleData = [
                {
                    "Employee ID": "FAC001",
                    "First Name": "Alice",
                    "Last Name": "Smith",
                    "Email": "alice.smith@sece.ac.in",
                    "Department Code": "CSE",
                    "Designation": "Associate Professor",
                    "Phone": "9876543211",
                    "Class Advisor (e.g., \"2 CSE A\" or leave blank)": "2 CSE A",
                    "Is Innovation Coordinator (TRUE/FALSE)": "FALSE"
                }
            ];
            fileName = "faculty_import_sample.xlsx";
        } else if (target === "Events") {
            sampleData = [
                {
                    EventName: "Tech Symposium 2026",
                    Type: "Workshop",
                    Date: "2026-03-15",
                    Venue: "Main Auditorium",
                    Description: "A national level technical symposium.",
                    URL: "https://symposium.sece.ac.in"
                }
            ];
            fileName = "event_import_sample.xlsx";
        }

        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, target);
        XLSX.writeFile(workbook, fileName);
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const processImport = async () => {
        if (!file) return;

        try {
            setProcessing(true);
            setResults(null);
            setProgress(0);

            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    alert("No data found in the Excel file");
                    setProcessing(false);
                    return;
                }

                let success = 0;
                let failed = 0;
                const total = jsonData.length;

                for (let i = 0; i < total; i++) {
                    try {
                        const item = jsonData[i];
                        if (target === "Students") {
                            const firstName = item["First Name"] || "";
                            const lastName = item["Last Name"] || "";
                            const fullName = `${firstName} ${lastName}`.trim();

                            await createStudent({
                                student_register_no: String(item["Roll Number"] || item.roll_no), // Using Roll Number as fallback for Reg No if not present
                                roll_no: String(item["Roll Number"] || item.roll_no),
                                name: fullName || item.Name || item.name,
                                email: item.Email || item.email,
                                department: item["Department Code"] || item.Dept || item.department,
                                year: Number(item.Year || item.year),
                                section: item.Section || item.section || "A",
                                phone: item.Phone || "",
                                cgpa: item.CGPA !== undefined ? item.CGPA : null,
                                advisor_id: selectedAdvisorId || null,
                                status: "active"
                            });
                        } else if (target === "Faculty") {
                            const firstName = item["First Name"] || "";
                            const lastName = item["Last Name"] || "";
                            const fullName = `${firstName} ${lastName}`.trim();

                            const advisorField = item["Class Advisor (e.g., \"2 CSE A\" or leave blank)"] || "";
                            const isAdvisor = !!advisorField;
                            const isInnovationCoord = String(item["Is Innovation Coordinator (TRUE/FALSE)"]).toUpperCase() === "TRUE";

                            let role = "mentor";
                            if (isInnovationCoord) role = "coordinator";
                            else if (isAdvisor) role = "advisor";

                            // Parse year and section from "2 CSE A" or similar
                            let year = [];
                            let section = [];
                            if (isAdvisor) {
                                const parts = advisorField.split(" ");
                                const y = parseInt(parts[0]);
                                if (!isNaN(y)) year = [y];
                                const s = parts.pop();
                                if (s && s.length === 1) section = [s.toUpperCase()];
                            }

                            await createFaculty({
                                faculty_id: String(item["Employee ID"] || ""),
                                name: fullName || item.Name || item.name,
                                email: item.Email || item.email,
                                department: item["Department Code"] || item.Dept || item.department,
                                designation: item.Designation || item.designation || "Assistant Professor",
                                role: role,
                                assigned_sections: section,
                                assigned_years: year
                            });
                        } else if (target === "Events") {
                            await createEvent({
                                event_name: item.EventName || item.name,
                                event_type: item.Type || item.event_type || "Workshop",
                                event_date: item.Date || item.event_date,
                                venue: item.Venue || item.venue || "Campus",
                                description: item.Description || item.description || "",
                                event_url: item.URL || item.event_url || ""
                            });
                        }
                        success++;
                        // Add a small delay to avoid rate limiting
                        await sleep(200);
                    } catch (err) {
                        console.error("Row failed:", err);
                        failed++;
                    }
                    setProgress(Math.round(((i + 1) / total) * 100));
                }

                setResults({ success, failed, total });
                setProcessing(false);
                setFile(null);
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error("Import error:", error);
            alert("Failed to process file");
            setProcessing(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#1E2761]">Excel Import</h1>
                <p className="text-gray-500 text-sm mt-1">Bulk import students, faculty, or event data</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div
                        className={`bg-white border-2 border-dashed rounded-3xl p-12 text-center transition-all ${dragActive ? 'border-[#1E2761] bg-blue-50/30' : 'border-gray-200'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                            <Icons.Import />
                        </div>
                        {file ? (
                            <div>
                                <p className="text-[#1E2761] font-bold text-lg mb-2">{file.name}</p>
                                <p className="text-gray-400 text-sm mb-6">{(file.size / 1024).toFixed(2)} KB</p>
                                <button
                                    onClick={() => setFile(null)}
                                    className="px-6 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 text-xs font-bold uppercase tracking-widest transition-colors"
                                >
                                    Remove File
                                </button>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Drag and drop your Excel file here</h3>
                                <p className="text-gray-400 text-sm mb-8">Supports .xlsx and .csv formats</p>
                                <label className="inline-block px-8 py-3 bg-[#1E2761] text-white rounded-xl shadow-lg shadow-[#1E2761]/20 font-bold text-sm hover:scale-105 transition-transform cursor-pointer">
                                    Browse Files
                                    <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                                </label>
                            </div>
                        )}
                    </div>

                    {results && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center justify-between">
                            <div>
                                <h4 className="text-emerald-800 font-bold">Import Complete</h4>
                                <p className="text-emerald-600 text-sm">Processed {results.total} records</p>
                            </div>
                            <div className="flex gap-6">
                                <div className="text-center">
                                    <div className="text-xl font-black text-emerald-700">{results.success}</div>
                                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Success</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-black text-red-600">{results.failed}</div>
                                    <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Failed</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-gray-100 p-8">
                        <h4 className="font-bold text-[#1E2761] mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center text-xs">1</span>
                            Select Target Collection
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {['Students', 'Faculty', 'Events'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setTarget(type)}
                                    className={`p-4 border rounded-xl text-center transition-all group ${target === type ? 'border-[#1E2761] bg-blue-50 shadow-sm' : 'border-gray-100 hover:border-gray-300'}`}
                                >
                                    <div className={`text-sm font-bold ${target === type ? 'text-[#1E2761]' : 'text-gray-600'}`}>{type}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {target === "Students" && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-8">
                            <h4 className="font-bold text-[#1E2761] mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center text-xs">2</span>
                                Select Advisor (Optional)
                            </h4>
                            <p className="text-xs text-gray-500 mb-4">You can assign a common advisor to all students in this import.</p>
                            <select
                                value={selectedAdvisorId}
                                onChange={(e) => setSelectedAdvisorId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#1E2761] focus:border-transparent outline-none transition-all text-sm"
                            >
                                <option value="">No Advisor (Default)</option>
                                {advisors.map(advisor => (
                                    <option key={advisor.$id} value={advisor.$id}>
                                        {advisor.name} ({advisor.department})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-[#1E2761] rounded-2xl p-8 text-white">
                        <h4 className="font-bold mb-4 text-white">Requirements for {target}</h4>
                        <ul className="space-y-4 text-sm text-white/70 leading-relaxed">
                            {target === "Students" && (
                                <>
                                    <li className="flex gap-3">Roll Number, First Name, Last Name, Email</li>
                                    <li className="flex gap-3">Phone, Department Code, Year, Section, CGPA</li>
                                </>
                            )}
                            {target === "Faculty" && (
                                <>
                                    <li className="flex gap-3">Employee ID, First Name, Last Name, Email</li>
                                    <li className="flex gap-3">Dept Code, Designation, Phone, Class Advisor, etc.</li>
                                </>
                            )}
                            {target === "Events" && (
                                <>
                                    <li className="flex gap-3">EventName, Type, Date, Venue</li>
                                    <li className="flex gap-3">Description, URL</li>
                                </>
                            )}
                        </ul>
                        <button
                            onClick={downloadSample}
                            className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            Download Sample
                        </button>
                    </div>

                    <div>
                        {processing ? (
                            <div className="w-full bg-white rounded-xl border border-gray-100 p-6 space-y-4 shadow-xl">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#1E2761]">
                                    <span>Importing {target}...</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#1E2761] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-gray-400 text-[10px] font-medium text-center">Please do not close this window</p>
                            </div>
                        ) : (
                            <button
                                onClick={processImport}
                                disabled={!file}
                                className="w-full bg-emerald-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-emerald-600/20 hover:scale-[1.02] transition-transform active:scale-95"
                            >
                                Start Processing
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
