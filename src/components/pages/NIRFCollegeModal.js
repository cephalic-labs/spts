"use client";

import { useEffect, useState } from "react";
import {
  createNIRFCollege,
  updateNIRFCollege,
} from "@/lib/services/nirfCollegeService";

export default function NIRFCollegeModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
}) {
  const isEdit = Boolean(initialData);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    college_name: "",
    rank: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        college_name: initialData.college_name || "",
        rank:
          initialData.rank !== undefined && initialData.rank !== null
            ? String(initialData.rank)
            : "",
      });
      return;
    }

    setFormData({
      college_name: "",
      rank: "",
    });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await updateNIRFCollege(initialData.$id, formData);
      } else {
        await createNIRFCollege(formData);
      }

      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (error) {
      alert(
        error?.message ||
          `Failed to ${isEdit ? "update" : "create"} NIRF college.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#1E2761] px-4 py-4 sm:px-8 sm:py-6">
          <h2 className="text-lg font-bold text-white sm:text-xl">
            {isEdit ? "Edit NIRF College" : "Add NIRF College"}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-8">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              College Name
            </label>
            <input
              required
              type="text"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
              value={formData.college_name}
              onChange={(e) =>
                setFormData({ ...formData, college_name: e.target.value })
              }
              placeholder="Enter college name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Rank</label>
            <input
              required
              type="number"
              min="1"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-[#1E2761]"
              value={formData.rank}
              onChange={(e) =>
                setFormData({ ...formData, rank: e.target.value })
              }
              placeholder="Enter rank"
            />
          </div>

          <div className="flex gap-3 pt-2">
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
              className="flex-1 rounded-xl bg-[#1E2761] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#2d3a7d] disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : isEdit
                  ? "Update College"
                  : "Add College"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
