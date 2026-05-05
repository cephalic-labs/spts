"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { updateUserProfile } from "@/lib/services/userService";
import { account } from "@/lib/appwrite";
import {
  ADMIN_ROLES,
  ADMIN_SUDO_COORDINATOR_ROLES,
  ADMIN_SUDO_ROLES,
  OD_CATEGORY_FIELDS,
} from "@/lib/dbConfig";
import {
  getODQuotaPolicy,
  saveODQuotaPolicy,
} from "@/lib/services/odQuotaService";
import { deleteNIRFCollege } from "@/lib/services/nirfCollegeService";
import { getStudentByRollNo } from "@/lib/services/studentService";
import {
  resetStudentODCountsAtomic,
  resetStudentsByYearAtomic,
} from "@/actions/odCountManager";
import NIRFCollegeModal from "./NIRFCollegeModal";
import PromoteStudentsModal from "./PromoteStudentsModal";
import ActionButtons from "@/components/ui/ActionButtons";

const emptyQuotaForm = OD_CATEGORY_FIELDS.reduce((accumulator, field) => {
  accumulator[field] = "";
  return accumulator;
}, {});

export default function SettingsPageContent({ role }) {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [quotaForm, setQuotaForm] = useState(emptyQuotaForm);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaSaving, setQuotaSaving] = useState(false);
  const [quotaMessage, setQuotaMessage] = useState(null);

  const [resetRollNo, setResetRollNo] = useState("");
  const [resetYear, setResetYear] = useState("");
  const [resetCustomTotal, setResetCustomTotal] = useState("");
  const [resetStudent, setResetStudent] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoMessage, setPromoMessage] = useState(null);

  const [nirfColleges, setNirfColleges] = useState([]);
  const [nirfLoading, setNirfLoading] = useState(false);
  const [nirfMessage, setNirfMessage] = useState(null);
  const [nirfModalOpen, setNirfModalOpen] = useState(false);
  const [editingNirfCollege, setEditingNirfCollege] = useState(null);

  const canEditQuota = ADMIN_ROLES.includes(role);
  const canManageNirf = ADMIN_SUDO_COORDINATOR_ROLES.includes(role);

  const quotaTotal = useMemo(() => {
    return OD_CATEGORY_FIELDS.reduce(
      (total, field) => total + (parseInt(quotaForm[field] || 0, 10) || 0),
      0,
    );
  }, [quotaForm]);

  useEffect(() => {
    async function loadAdminData() {
      if (canEditQuota) {
        try {
          setQuotaLoading(true);
          const policy = await getODQuotaPolicy();
          if (policy) {
            const nextForm = {};
            for (const field of OD_CATEGORY_FIELDS) {
              nextForm[field] =
                policy[field] !== undefined && policy[field] !== null
                  ? String(policy[field])
                  : "";
            }
            setQuotaForm(nextForm);
          }
        } catch (error) {
          setQuotaMessage({
            type: "error",
            text: "Failed to load OD quota policy.",
          });
        } finally {
          setQuotaLoading(false);
        }
      }

      if (canManageNirf) {
        try {
          setNirfLoading(true);
          const res = await fetch("/api/nirf-colleges?limit=100&offset=0");
          const response = await res.json();
          setNirfColleges(response.documents || []);
        } catch (error) {
          setNirfMessage({
            type: "error",
            text: "Failed to load NIRF college list.",
          });
        } finally {
          setNirfLoading(false);
        }
      }
    }

    loadAdminData();
  }, [canEditQuota, canManageNirf]);

  const handleUpdate = async () => {
    try {
      setSaving(true);
      setMessage(null);

      await account.updateName(name);
      await updateUserProfile(user.dbId, { user_name: name });
      await refreshUser();
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuotaSave = async () => {
    try {
      setQuotaSaving(true);
      setQuotaMessage(null);
      await saveODQuotaPolicy(quotaForm);
      setQuotaMessage({ type: "success", text: "OD quota policy saved." });
    } catch (error) {
      setQuotaMessage({
        type: "error",
        text: error?.message || "Failed to save OD quota policy.",
      });
    } finally {
      setQuotaSaving(false);
    }
  };

  const refreshNIRFColleges = async () => {
    const res = await fetch("/api/nirf-colleges?limit=100&offset=0");
    const response = await res.json();
    setNirfColleges(response.documents || []);
  };

  const handleResetStudent = async () => {
    try {
      setResetLoading(true);
      setResetMessage(null);
      setResetStudent(null);

      const student = await getStudentByRollNo(resetRollNo);
      if (!student) {
        setResetMessage({
          type: "error",
          text: "Student not found for that roll number.",
        });
        return;
      }

      const customTotal = resetCustomTotal.trim()
        ? parseInt(resetCustomTotal, 10)
        : null;
      await resetStudentODCountsAtomic(student.$id, role, customTotal);
      setResetStudent(student);
      setResetMessage({
        type: "success",
        text: `OD counts reset for ${student.name}.`,
      });
    } catch (error) {
      setResetMessage({
        type: "error",
        text: error?.message || "Failed to reset OD counts.",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetByYear = async () => {
    try {
      setResetLoading(true);
      setResetMessage(null);
      setResetStudent(null);

      if (!resetYear) {
        setResetMessage({
          type: "error",
          text: "Please select a year.",
        });
        return;
      }

      const customTotal = resetCustomTotal.trim()
        ? parseInt(resetCustomTotal, 10)
        : null;
      const totalUpdated = await resetStudentsByYearAtomic(
        resetYear,
        role,
        customTotal,
      );
      setResetMessage({
        type: "success",
        text: `OD counts reset for ${totalUpdated} student(s) in Year ${resetYear}.`,
      });
    } catch (error) {
      setResetMessage({
        type: "error",
        text: error?.message || "Failed to reset OD counts.",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteNIRFCollege = async (collegeId) => {
    if (!window.confirm("Remove this college from the NIRF list?")) return;

    try {
      setNirfMessage(null);
      await deleteNIRFCollege(collegeId);
      await refreshNIRFColleges();
      setNirfMessage({ type: "success", text: "NIRF college removed." });
    } catch (error) {
      setNirfMessage({
        type: "error",
        text: error?.message || "Failed to remove NIRF college.",
      });
    }
  };

  const handleCloseCollegeModal = () => {
    setNirfModalOpen(false);
    setEditingNirfCollege(null);
  };

  const handleCollegeSaved = async () => {
    await refreshNIRFColleges();
    setNirfMessage({ type: "success", text: "NIRF college saved." });
    handleCloseCollegeModal();
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-col items-center gap-8 rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md md:p-10">
        <div className="flex w-full flex-col items-center gap-4 border-b border-gray-50 pb-8">
          <div className="group relative">
            <div className="h-28 w-28 overflow-hidden rounded-full border-[6px] border-white shadow-xl shadow-black/5">
              <img
                src={
                  user?.profile_url ||
                  "https://randomuser.me/api/portraits/thumb/men/93.jpg"
                }
                alt="Profile"
                className="h-full w-full transform object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl leading-none font-black tracking-tight text-[#1E2761] uppercase">
              {user?.name}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="w-fit rounded-[6px] bg-[#1E2761] px-2.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm shadow-[#1E2761]/20">
                {role}
              </span>
              <span className="text-center text-xs font-medium tracking-wide break-all text-gray-400">
                {user?.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-6">
          <div className="w-full space-y-2">
            <label className="block pl-1 text-[10px] font-black tracking-widest text-gray-400 uppercase">
              Display Name
            </label>
            <div className="group relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-bold text-[#1E2761] shadow-sm transition-all group-hover:border-gray-300 placeholder:font-normal placeholder:text-gray-300 focus:border-[#1E2761] focus:ring-4 focus:ring-[#1E2761]/5 focus:outline-none"
                placeholder="Enter display name"
              />
            </div>
            <p className="pl-1 text-[10px] leading-tight text-gray-400">
              This name will be displayed across your profile and in the system.
            </p>
          </div>

          <div className="w-full space-y-2">
            <label className="block pl-1 text-[10px] font-black tracking-widest text-gray-400 uppercase">
              Email Address
            </label>
            <div className="cursor-not-allowed truncate rounded-2xl border border-gray-100 bg-gray-50/80 px-5 py-4 text-sm font-medium text-gray-400 select-none">
              {user?.email}
            </div>
            <p className="pl-1 text-[10px] leading-tight text-gray-400">
              Email address cannot be changed.
            </p>
          </div>

          {name !== user?.name && (
            <div className="animate-in fade-in slide-in-from-bottom-2 pt-2 duration-300">
              <button
                onClick={handleUpdate}
                disabled={saving || !name}
                className="h-[56px] w-full rounded-xl bg-[#1E2761] text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-[#1E2761]/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[#2d3a7d] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center justify-center gap-3 rounded-2xl border p-4 text-center text-sm font-bold shadow-sm ${message.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-red-100 bg-red-50 text-red-500"}`}
        >
          {message.text}
        </div>
      )}

      {canEditQuota && (
        <div className="space-y-6 rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div>
            <h3 className="text-xl font-black text-[#1E2761]">
              OD Quota Policy
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Edit the live OD quota values stored in{" "}
              <span className="font-semibold">od_quota</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {OD_CATEGORY_FIELDS.map((field) => (
              <div key={field} className="space-y-2">
                <label className="block text-xs font-black tracking-widest text-gray-400 uppercase">
                  {field.replace("_", " ")}
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                  value={quotaForm[field]}
                  onChange={(e) =>
                    setQuotaForm({ ...quotaForm, [field]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Total default OD balance:{" "}
                <span className="font-bold text-[#1E2761]">{quotaTotal}</span>
              </p>
              <p className="text-xs text-gray-400">
                This total is applied manually when resetting a student.
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuotaSave}
              disabled={quotaSaving || quotaLoading}
              className="rounded-xl bg-[#1E2761] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2d3a7d] disabled:opacity-50"
            >
              {quotaSaving ? "Saving..." : "Save Quota Policy"}
            </button>
          </div>

          {quotaMessage && (
            <div
              className={`rounded-xl p-3 text-sm font-semibold ${quotaMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
            >
              {quotaMessage.text}
            </div>
          )}
        </div>
      )}

      {ADMIN_ROLES.includes(role) && (
        <div className="space-y-6 rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div>
            <h3 className="text-xl font-black text-[#1E2761]">
              Manual OD Reset
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Reset OD counts to policy values or custom total.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-black tracking-widest text-gray-400 uppercase">
                Custom Total OD Count (Optional)
              </label>
              <input
                type="number"
                min="0"
                value={resetCustomTotal}
                onChange={(e) => setResetCustomTotal(e.target.value)}
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                placeholder="Leave empty to use policy total"
              />
              <p className="pl-1 text-[10px] leading-tight text-gray-400">
                If set, this overrides the policy total ({quotaTotal}).
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <h4 className="mb-3 text-sm font-bold text-[#1E2761]">
                Reset by Roll Number
              </h4>
              <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <label className="block text-xs font-black tracking-widest text-gray-400 uppercase">
                    Student Roll Number
                  </label>
                  <input
                    type="text"
                    value={resetRollNo}
                    onChange={(e) => setResetRollNo(e.target.value)}
                    className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                    placeholder="Enter exact roll number"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleResetStudent}
                  disabled={resetLoading || !resetRollNo.trim()}
                  className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                >
                  {resetLoading ? "Resetting..." : "Reset Student"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <h4 className="mb-3 text-sm font-bold text-[#1E2761]">
                Reset by Year of Study
              </h4>
              <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <label className="block text-xs font-black tracking-widest text-gray-400 uppercase">
                    Year of Study
                  </label>
                  <select
                    value={resetYear}
                    onChange={(e) => setResetYear(e.target.value)}
                    className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-[#1E2761]/20 focus:outline-none"
                  >
                    <option value="">Select Year</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleResetByYear}
                  disabled={resetLoading || !resetYear}
                  className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                >
                  {resetLoading ? "Resetting..." : "Reset Year"}
                </button>
              </div>
            </div>
            {/** Promote students (admin + sudo) */}
            <div className="mt-4">
              {ADMIN_SUDO_ROLES.includes(role) && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setPromoOpen(true);
                      setPromoMessage(null);
                    }}
                    className="mt-3 rounded-xl bg-[#1E2761] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2d3a7d]"
                  >
                    Promote Students by Year
                  </button>

                  {promoMessage && (
                    <div
                      className={`mt-3 rounded-xl p-3 text-sm font-semibold ${promoMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
                    >
                      {promoMessage.text}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {resetStudent && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Reset applied to{" "}
              <span className="font-bold text-[#1E2761]">
                {resetStudent.name}
              </span>{" "}
              ({resetStudent.roll_no}).
            </div>
          )}

          {resetMessage && (
            <div
              className={`rounded-xl p-3 text-sm font-semibold ${resetMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
            >
              {resetMessage.text}
            </div>
          )}
        </div>
      )}

      {canManageNirf && (
        <div className="space-y-6 rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-[#1E2761]">
                NIRF College List
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage the searchable colleges used for the NIRF host type.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingNirfCollege(null);
                setNirfModalOpen(true);
              }}
              className="rounded-xl bg-[#1E2761] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2d3a7d]"
            >
              Add College
            </button>
          </div>

          {nirfMessage && (
            <div
              className={`rounded-xl p-3 text-sm font-semibold ${nirfMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
            >
              {nirfMessage.text}
            </div>
          )}

          {nirfLoading ? (
            <div className="text-sm text-gray-500">Loading colleges...</div>
          ) : nirfColleges.length === 0 ? (
            <div className="text-sm text-gray-500">
              No colleges in the NIRF list yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 text-xs tracking-widest text-gray-400 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">College</th>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nirfColleges.map((college) => (
                    <tr key={college.$id} className="border-t border-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                        {college.college_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        #{college.rank}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionButtons
                          onEdit={() => {
                            setEditingNirfCollege(college);
                            setNirfModalOpen(true);
                          }}
                          onDelete={() => handleDeleteNIRFCollege(college.$id)}
                          editTitle="Edit College"
                          deleteTitle="Delete College"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <NIRFCollegeModal
        isOpen={nirfModalOpen}
        onClose={handleCloseCollegeModal}
        onSuccess={handleCollegeSaved}
        initialData={editingNirfCollege}
      />
      <PromoteStudentsModal
        isOpen={promoOpen}
        onClose={() => setPromoOpen(false)}
        onSuccess={() => {
          setPromoOpen(false);
          setPromoMessage({
            type: "success",
            text: "Students promoted successfully.",
          });
        }}
        role={role}
      />
    </div>
  );
}
