"use client";

import { useState, useEffect } from "react";
import { createStudent, updateStudent } from "@/lib/services/studentService";
import { DEPARTMENTS_LIST, OD_CATEGORY_FIELDS } from "@/lib/dbConfig";
import { Icons } from "@/components/layout";

export default function AddStudentModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
}) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_register_no: "",
    roll_no: "",
    name: "",
    email: "",
    department: "",
    year: "",
    section: "",
    phone: "",
    cgpa: "",
    iit_nit: "",
    university: "",
    nirf: "",
    industry: "",
    others: "",
    status: "active",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        student_register_no: initialData.student_register_no || "",
        roll_no: initialData.roll_no || "",
        name: initialData.name || "",
        email: initialData.email || "",
        department: initialData.department || "",
        year: initialData.year || "",
        section: initialData.section || "",
        phone: initialData.phone || "",
        cgpa: initialData.cgpa || "",
        iit_nit:
          initialData.iit_nit !== undefined && initialData.iit_nit !== null
            ? String(initialData.iit_nit)
            : "",
        university:
          initialData.university !== undefined &&
          initialData.university !== null
            ? String(initialData.university)
            : "",
        nirf:
          initialData.nirf !== undefined && initialData.nirf !== null
            ? String(initialData.nirf)
            : "",
        industry:
          initialData.industry !== undefined && initialData.industry !== null
            ? String(initialData.industry)
            : "",
        others:
          initialData.others !== undefined && initialData.others !== null
            ? String(initialData.others)
            : "",
        status: initialData.status || "active",
      });
    } else {
      setFormData({
        student_register_no: "",
        roll_no: "",
        name: "",
        email: "",
        department: "",
        year: "",
        section: "",
        phone: "",
        cgpa: "",
        iit_nit: "",
        university: "",
        nirf: "",
        industry: "",
        others: "",
        status: "active",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEdit) {
        await updateStudent(initialData.$id, formData);
      } else {
        await createStudent(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving student:", error);
      alert("Failed to save student record");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-8">
          <div>
            <h2 className="text-xl font-black text-[#1E2761] sm:text-2xl">
              {isEdit ? "Edit Student" : "Add New Student"}
            </h2>
            <p className="text-sm font-medium text-gray-400">
              Capture student academic details
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <Icons.Close />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(90vh-110px)] space-y-6 overflow-y-auto p-4 sm:p-8"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
                Register No
              </label>
              <input
                required
                type="text"
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                value={formData.student_register_no}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    student_register_no: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
                Roll No
              </label>
              <input
                required
                type="text"
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                value={formData.roll_no}
                onChange={(e) =>
                  setFormData({ ...formData, roll_no: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
                Full Name
              </label>
              <input
                required
                type="text"
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
                Email
              </label>
              <input
                required
                type="email"
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
                Department
              </label>
              <select
                required
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              >
                <option value="">Select Dept</option>
                {DEPARTMENTS_LIST.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
                  Year
                </label>
                <select
                  required
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                >
                  <option value="">Year</option>
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
                  Section
                </label>
                <input
                  type="text"
                  placeholder="A/B/H"
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({ ...formData, section: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black tracking-widest text-gray-400 uppercase">
                CGPA
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                value={formData.cgpa}
                onChange={(e) =>
                  setFormData({ ...formData, cgpa: e.target.value })
                }
              />
            </div>
            <div className="space-y-3 md:col-span-2">
              <label className="block text-xs font-black tracking-widest text-gray-400 uppercase">
                OD Counts by Category
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {OD_CATEGORY_FIELDS.map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase">
                      {field.replace("_", " ")}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                      value={formData[field]}
                      onChange={(e) =>
                        setFormData({ ...formData, [field]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-gray-400">
                Leave blank to keep the current value for edits.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl bg-gray-100 px-6 py-4 font-bold text-gray-500 transition-all hover:bg-gray-200 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-[#1E2761] px-6 py-4 font-bold text-white shadow-lg shadow-[#1E2761]/20 transition-all hover:bg-[#2d3a7d] active:scale-95 disabled:opacity-50 sm:flex-[2]"
            >
              {loading
                ? "Saving..."
                : isEdit
                  ? "Update Student"
                  : "Register Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
