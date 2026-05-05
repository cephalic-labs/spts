"use client";

import { useState } from "react";
import { promoteStudentsByYearAtomic } from "@/actions/odCountManager";
import { Icons } from "@/components/layout";
import { DEPARTMENTS_LIST } from "@/lib/dbConfig";

export default function PromoteStudentsModal({
  isOpen,
  onClose,
  onSuccess,
  role,
}) {
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fromYear || !toYear) {
      setMessage({
        type: "error",
        text: "Please select both From and To years.",
      });
      return;
    }

    if (fromYear === toYear) {
      setMessage({
        type: "error",
        text: "From and To years cannot be the same.",
      });
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to promote all students from Year ${fromYear} to Year ${toYear}${
          department
            ? ` in the ${department} department`
            : " in ALL departments"
        }? This action cannot be easily undone.`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const totalUpdated = await promoteStudentsByYearAtomic(
        fromYear,
        toYear,
        role,
        department,
      );

      setMessage({
        type: "success",
        text: `Successfully updated the year for ${totalUpdated} student(s).`,
      });

      // Delay closing to show success message
      setTimeout(() => {
        onSuccess();
        onClose();
        setFromYear("");
        setToYear("");
        setDepartment("");
        setMessage(null);
      }, 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message || "Failed to update students.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#1E2761] px-4 py-4 sm:px-8 sm:py-6">
          <h2 className="text-lg font-bold text-white sm:text-xl">
            Promote Students
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <Icons.Close />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Department (Optional)
              </label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">All Departments</option>
                {DEPARTMENTS_LIST.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  From Year
                </label>
                <select
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
                  value={fromYear}
                  onChange={(e) => setFromYear(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  To Year
                </label>
                <select
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
                  value={toYear}
                  onChange={(e) => setToYear(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">Passed Out / 5th Year</option>
                </select>
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`rounded-xl p-3 text-sm font-semibold ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex flex-col-reverse gap-4 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 px-6 py-3 font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              type="submit"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1E2761] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#2d3a7d] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Updating...
                </>
              ) : (
                "Update Year"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
