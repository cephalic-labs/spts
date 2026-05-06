"use client";

import { useEffect, useMemo, useState } from "react";
import { createEvent, updateEvent } from "@/lib/services/eventService";
import { OD_HOST_TYPES } from "@/lib/dbConfig";
import { Icons } from "@/components/layout";

function formatDateOnly(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const matchedDate = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (matchedDate) {
      return matchedDate[1];
    }
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
}) {
  const isEdit = Boolean(initialData);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [nirfLoading, setNirfLoading] = useState(false);
  const [nirfSearch, setNirfSearch] = useState("");
  const [nirfColleges, setNirfColleges] = useState([]);
  const [formData, setFormData] = useState({
    event_name: "",
    event_host: "",
    event_host_type: "university",
    nirf_college_id: "",
    event_description: "",
    event_time: "",
    event_reg_deadline: "",
    event_url: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        event_name: initialData.event_name || "",
        event_host: initialData.event_host || "",
        event_host_type:
          initialData.host_type || initialData.event_host_type || "university",
        nirf_college_id: "",
        event_description: initialData.event_description || "",
        event_time: formatDateOnly(initialData.event_time),
        event_reg_deadline: formatDateOnly(initialData.event_reg_deadline),
        event_url: initialData.event_url || "",
      });
      return;
    }

    setFormData({
      event_name: "",
      event_host: "",
      event_host_type: "university",
      nirf_college_id: "",
      event_description: "",
      event_time: "",
      event_reg_deadline: "",
      event_url: "",
    });
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const hostType = formData.event_host_type || "university";
    if (hostType !== "nirf") {
      return;
    }

    let cancelled = false;
    async function loadNIRFColleges() {
      try {
        setNirfLoading(true);
        const params = new URLSearchParams({
          limit: "100",
          offset: "0",
          search: nirfSearch.trim(),
        });
        const res = await fetch(`/api/nirf-colleges?${params}`);
        const response = await res.json();
        const filteredColleges = (response.documents || []).filter(
          (college) => {
            const rank = parseInt(college.rank, 10);
            return !Number.isNaN(rank) && rank > 0 && rank <= 100;
          },
        );
        if (!cancelled) {
          setNirfColleges(filteredColleges);
        }
      } catch (error) {
        if (!cancelled) {
          setNirfColleges([]);
        }
      } finally {
        if (!cancelled) {
          setNirfLoading(false);
        }
      }
    }

    loadNIRFColleges();

    return () => {
      cancelled = true;
    };
  }, [isOpen, formData.event_host_type, nirfSearch]);

  const selectedNIRFCollege = useMemo(() => {
    return (
      nirfColleges.find(
        (college) => college.$id === formData.nirf_college_id,
      ) || null
    );
  }, [nirfColleges, formData.nirf_college_id]);

  useEffect(() => {
    if (formData.event_host_type !== "nirf") {
      setFormData((prev) => ({
        ...prev,
        nirf_college_id: "",
      }));
      return;
    }

    setFormData((prev) => {
      const nextHost = selectedNIRFCollege?.college_name || prev.event_host;
      if (prev.event_host === nextHost) {
        return prev;
      }

      return {
        ...prev,
        event_host: nextHost,
      };
    });
  }, [formData.event_host_type, selectedNIRFCollege]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDateError("");

    if (
      formData.event_reg_deadline &&
      formData.event_time &&
      formData.event_reg_deadline > formData.event_time
    ) {
      setDateError(
        "Registration deadline must be on or before the event date.",
      );
      return;
    }

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
      alert(
        `Failed to ${isEdit ? "update" : "create"} event. Please try again.`,
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#1E2761] px-4 py-4 sm:px-8 sm:py-6">
          <h2 className="text-lg font-bold text-white sm:text-xl">
            {isEdit ? "Edit Event" : "Create New Event"}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <Icons.Close />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(90vh-90px)] space-y-6 overflow-y-auto p-4 sm:p-8"
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Event Name
            </label>
            <input
              required
              type="text"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
              placeholder="Enter event name"
              value={formData.event_name}
              onChange={(e) =>
                setFormData({ ...formData, event_name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Host Type
            </label>
            <select
              required
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
              value={formData.event_host_type}
              onChange={(e) =>
                setFormData({ ...formData, event_host_type: e.target.value })
              }
            >
              {OD_HOST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === "iit_nit"
                    ? "IIT / NIT"
                    : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {formData.event_host_type === "nirf" ? (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Search NIRF College
              </label>
              <input
                type="search"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
                placeholder="Search by college name..."
                value={nirfSearch}
                onChange={(e) => setNirfSearch(e.target.value)}
              />
              <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-sm">
                {nirfLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Loading colleges...
                  </div>
                ) : nirfColleges.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No colleges found.
                  </div>
                ) : (
                  nirfColleges.map((college) => (
                    <button
                      key={college.$id}
                      type="button"
                      className={`w-full border-b border-gray-50 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-[#1E2761]/5 ${formData.nirf_college_id === college.$id ? "bg-[#1E2761]/10 font-semibold text-[#1E2761]" : "text-gray-700"}`}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          nirf_college_id: college.$id,
                          event_host: college.college_name,
                          event_category: "nirf",
                        })
                      }
                    >
                      <span className="block">{college.college_name}</span>
                      <span className="block text-xs text-gray-400">
                        Rank #{college.rank}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Event Host / Organization
              </label>
              <input
                required
                type="text"
                maxLength={100}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
                placeholder="Enter host name (e.g. Department of CSE)"
                value={formData.event_host}
                onChange={(e) =>
                  setFormData({ ...formData, event_host: e.target.value })
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Description
            </label>
            <textarea
              required
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
              placeholder="Describe your event..."
              value={formData.event_description}
              onChange={(e) =>
                setFormData({ ...formData, event_description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Event Date
              </label>
              <input
                required
                type="date"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
                value={formData.event_time}
                onChange={(e) =>
                  setFormData({ ...formData, event_time: e.target.value })
                }
                min={formData.event_reg_deadline || undefined}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Registration Deadline
              </label>
              <input
                required
                type="date"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
                value={formData.event_reg_deadline}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    event_reg_deadline: e.target.value,
                  })
                }
                max={formData.event_time || undefined}
              />
            </div>
          </div>

          {dateError && (
            <p className="text-sm font-medium text-red-600">{dateError}</p>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Event URL / Registration Link
            </label>
            <input
              required
              type="url"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
              placeholder="https://..."
              value={formData.event_url}
              onChange={(e) =>
                setFormData({ ...formData, event_url: e.target.value })
              }
            />
          </div>

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
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Update Event"
              ) : (
                "Create Event"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
