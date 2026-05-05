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
  const [target, setTarget] = useState(
    role === "coordinator" ? "Events" : "Students",
  );
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [advisors, setAdvisors] = useState([]);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState("");

  useEffect(() => {
    const fetchAdvisors = async () => {
      try {
        const response = await getFaculties({}, 500);
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
          Email: "john.doe@sece.ac.in",
          Phone: "9876543210",
          "Department Code": "CSE",
          Year: 3,
          Section: "A",
          CGPA: 8.5,
        },
      ];
      fileName = "student_import_sample.csv";
    } else if (target === "Faculty") {
      sampleData = [
        {
          "Employee ID": "FAC001",
          "First Name": "Alice",
          "Last Name": "Smith",
          Email: "alice.smith@sece.ac.in",
          "Department Code": "CSE",
          Designation: "Associate Professor",
          Phone: "9876543211",
          'Class Advisor (e.g., "2 CSE A" or leave blank)': "2 CSE A",
          "Is Innovation Coordinator (TRUE/FALSE)": "FALSE",
        },
      ];
      fileName = "faculty_import_sample.xlsx";
    } else if (target === "Events") {
      sampleData = [
        {
          "Event Name": "Tech Symposium 2026",
          "Event Host": "Department of CSE",
          "Event Description": "A national level technical symposium.",
          "Event Category": "university",
          "Event Date": "2026-03-15",
          "Registration Deadline": "2026-03-10",
          "Event URL": "https://symposium.sece.ac.in",
        },
      ];
      fileName = "event_import_sample.csv";
    }

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, target);
    XLSX.writeFile(workbook, fileName);
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const normalizeHeader = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const getCellValue = (row, aliases) => {
    for (const alias of aliases) {
      if (
        row[alias] !== undefined &&
        row[alias] !== null &&
        String(row[alias]).trim() !== ""
      ) {
        return row[alias];
      }
    }

    const normalizedAliases = aliases.map(normalizeHeader);
    for (const key of Object.keys(row)) {
      if (normalizedAliases.includes(normalizeHeader(key))) {
        const value = row[key];
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          return value;
        }
      }
    }

    return "";
  };

  const toDateInputValue = (value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return "";
    }

    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) {
        const year = parsed.y;
        const month = String(parsed.m).padStart(2, "0");
        const day = String(parsed.d).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }

    const dateString = String(value).trim();
    const directMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
    if (directMatch) {
      return directMatch[1];
    }

    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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
                student_register_no: String(
                  item["Roll Number"] || item.roll_no,
                ), // Using Roll Number as fallback for Reg No if not present
                roll_no: String(item["Roll Number"] || item.roll_no),
                name: fullName || item.Name || item.name,
                email: item.Email || item.email,
                department:
                  item["Department Code"] || item.Dept || item.department,
                year: Number(item.Year || item.year),
                section: item.Section || item.section || "A",
                phone: item.Phone || "",
                cgpa: item.CGPA !== undefined ? item.CGPA : null,
                advisor_id: selectedAdvisorId || null,
                status: "active",
              });
            } else if (target === "Faculty") {
              const firstName = item["First Name"] || "";
              const lastName = item["Last Name"] || "";
              const fullName = `${firstName} ${lastName}`.trim();

              const advisorField =
                item['Class Advisor (e.g., "2 CSE A" or leave blank)'] || "";
              const isAdvisor = !!advisorField;
              const isInnovationCoord =
                String(
                  item["Is Innovation Coordinator (TRUE/FALSE)"],
                ).toUpperCase() === "TRUE";

              let roles = ["mentor"];
              if (isInnovationCoord) roles.push("coordinator");
              if (isAdvisor) roles.push("advisor");
              roles = [...new Set(roles)];

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
                department:
                  item["Department Code"] || item.Dept || item.department,
                designation:
                  item.Designation || item.designation || "Assistant Professor",
                role: roles,
                assigned_sections: section,
                assigned_years: year,
              });
            } else if (target === "Events") {
              const eventName = getCellValue(item, [
                "Event Name",
                "EventName",
                "Name",
                "event_name",
                "name",
              ]);
              const eventHost = getCellValue(item, [
                "Event Host",
                "EventHost",
                "Host",
                "Organizer",
                "Organisation",
                "Organization",
                "event_host",
              ]);
              const eventDescription = getCellValue(item, [
                "Event Description",
                "Description",
                "event_description",
                "description",
              ]);
              const eventTime = toDateInputValue(
                getCellValue(item, [
                  "Event Date",
                  "Date",
                  "Event Time",
                  "event_time",
                ]),
              );
              const eventRegDeadline = toDateInputValue(
                getCellValue(item, [
                  "Registration Deadline",
                  "Reg Deadline",
                  "Deadline",
                  "event_reg_deadline",
                ]),
              );
              const eventUrl = String(
                getCellValue(item, [
                  "Event URL",
                  "URL",
                  "Registration URL",
                  "event_url",
                ]),
              ).trim();
              const eventCategory = getCellValue(item, [
                "Event Category",
                "Category",
                "event_category",
                "category",
              ]);

              const missingFields = [];
              if (!eventName) missingFields.push("Event Name");
              if (!eventHost) missingFields.push("Event Host");
              if (!eventDescription) missingFields.push("Event Description");
              if (!eventTime) missingFields.push("Event Date");
              if (!eventRegDeadline)
                missingFields.push("Registration Deadline");
              if (!eventUrl) missingFields.push("Event URL");

              if (missingFields.length > 0) {
                throw new Error(
                  `Missing required event fields: ${missingFields.join(", ")}`,
                );
              }

              if (eventRegDeadline > eventTime) {
                throw new Error(
                  "Registration Deadline must be on or before Event Date",
                );
              }

              await createEvent({
                event_name: String(eventName).trim(),
                event_host: String(eventHost).trim(),
                event_description: String(eventDescription).trim(),
                event_time: eventTime,
                event_reg_deadline: eventRegDeadline,
                event_url: eventUrl,
              });
            }
            success++;
            // Add a small delay to avoid rate limiting
            await sleep(200);
          } catch (err) {
            console.error(`Row ${i + 2} failed:`, err);
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
        <p className="mt-1 text-sm text-gray-500">
          Bulk import students, faculty, or event data
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <div
            className={`rounded-3xl border-2 border-dashed bg-white p-6 text-center transition-all sm:p-12 ${dragActive ? "border-[#1E2761] bg-blue-50/30" : "border-gray-200"}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-300">
              <Icons.Import />
            </div>
            {file ? (
              <div>
                <p className="mb-2 text-lg font-bold text-[#1E2761]">
                  {file.name}
                </p>
                <p className="mb-6 text-sm text-gray-400">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={() => setFile(null)}
                  className="rounded-xl border border-red-200 px-6 py-2 text-xs font-bold tracking-widest text-red-600 uppercase transition-colors hover:bg-red-50"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div>
                <h3 className="mb-2 text-xl font-bold text-gray-700">
                  Drag and drop your Excel file here
                </h3>
                <p className="mb-8 text-sm text-gray-400">
                  Supports .xlsx and .csv formats
                </p>
                <label className="inline-block cursor-pointer rounded-xl bg-[#1E2761] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E2761]/20 transition-transform hover:scale-105">
                  Browse Files
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
          </div>

          {results && (
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 sm:flex-row sm:items-center">
              <div>
                <h4 className="font-bold text-emerald-800">Import Complete</h4>
                <p className="text-sm text-emerald-600">
                  Processed {results.total} records
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-xl font-black text-emerald-700">
                    {results.success}
                  </div>
                  <div className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                    Success
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-red-600">
                    {results.failed}
                  </div>
                  <div className="text-[10px] font-bold tracking-widest text-red-400 uppercase">
                    Failed
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-8">
            <h4 className="mb-6 flex items-center gap-2 font-bold text-[#1E2761]">
              <span className="flex h-8 w-8 items-center justify-center rounded bg-blue-50 text-xs text-blue-600">
                1
              </span>
              Select Target Collection
            </h4>
            {!["advisor", "coordinator"].includes(role) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {["Students", "Faculty", "Events"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTarget(type)}
                    className={`group rounded-xl border p-4 text-center transition-all ${target === type ? "border-[#1E2761] bg-blue-50 shadow-sm" : "border-gray-100 hover:border-gray-300"}`}
                  >
                    <div
                      className={`text-sm font-bold ${target === type ? "text-[#1E2761]" : "text-gray-600"}`}
                    >
                      {type}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {target === "Students" && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-8">
              <h4 className="mb-6 flex items-center gap-2 font-bold text-[#1E2761]">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-blue-50 text-xs text-blue-600">
                  2
                </span>
                Select Advisor (Optional)
              </h4>
              <p className="mb-4 text-xs text-gray-500">
                You can assign a common advisor to all students in this import.
              </p>
              <select
                value={selectedAdvisorId}
                onChange={(e) => setSelectedAdvisorId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
              >
                <option value="">No Advisor (Default)</option>
                {advisors.map((advisor) => (
                  <option key={advisor.$id} value={advisor.$id}>
                    {advisor.name} ({advisor.department})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-[#1E2761] p-5 text-white sm:p-8">
            <h4 className="mb-4 font-bold text-white">
              Requirements for {target}
            </h4>
            <ul className="space-y-4 text-sm leading-relaxed text-white/70">
              {target === "Students" &&
                (role === "sudo" ||
                  role === "admin" ||
                  role === "hod" ||
                  role === "advisor") && (
                  <>
                    <li className="flex gap-3">
                      Roll Number, First Name, Last Name, Email
                    </li>
                    <li className="flex gap-3">
                      Phone, Department Code, Year, Section, CGPA
                    </li>
                  </>
                )}
              {target === "Faculty" &&
                (role === "sudo" || role === "admin" || role === "hod") && (
                  <>
                    <li className="flex gap-3">
                      Employee ID, First Name, Last Name, Email
                    </li>
                    <li className="flex gap-3">
                      Dept Code, Designation, Phone, Class Advisor, etc.
                    </li>
                  </>
                )}
              {target === "Events" &&
                (role === "sudo" ||
                  role === "admin" ||
                  role === "hod" ||
                  role === "coordinator") && (
                  <>
                    <li className="flex gap-3">
                      Event Name, Event Host, Event Description
                    </li>
                    <li className="flex gap-3">
                      Event Category, Event Date, Registration Deadline, Event
                      URL
                    </li>
                  </>
                )}
            </ul>
            <button
              onClick={downloadSample}
              className="mt-8 w-full rounded-xl bg-white/10 py-3 text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-white/20"
            >
              Download Sample
            </button>
          </div>

          <div>
            {processing ? (
              <div className="w-full space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-[#1E2761] uppercase">
                  <span>Importing {target}...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-[#1E2761] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-center text-[10px] font-medium text-gray-400">
                  Please do not close this window
                </p>
              </div>
            ) : (
              <button
                onClick={processImport}
                disabled={!file}
                className="w-full rounded-xl bg-emerald-600 py-4 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-600/20 transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200"
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
