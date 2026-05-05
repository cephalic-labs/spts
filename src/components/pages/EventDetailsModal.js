"use client";

import Link from "next/link";
import { Icons } from "@/components/layout";
import { PARTICIPATION_STATUS } from "@/lib/services/eventParticipationService";
import { formatEventDate } from "@/lib/utils/eventDates";

function getStatusBadgeClass(status) {
  if (status === PARTICIPATION_STATUS.PARTICIPATED) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  }

  if (status === PARTICIPATION_STATUS.NOT_PARTICIPATED) {
    return "bg-rose-50 text-rose-700 border border-rose-100";
  }

  return "bg-gray-100 text-gray-600 border border-gray-200";
}

function getStatusLabel(status) {
  if (status === PARTICIPATION_STATUS.PARTICIPATED) return "Participated";
  if (status === PARTICIPATION_STATUS.NOT_PARTICIPATED)
    return "Not Participated";
  return "Not Updated";
}

function getParticipationButtonClass(currentStatus, buttonStatus) {
  const isSelected = currentStatus === buttonStatus;

  if (buttonStatus === PARTICIPATION_STATUS.PARTICIPATED) {
    return isSelected
      ? "bg-emerald-800 text-white"
      : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
  }

  return isSelected
    ? "bg-rose-800 text-white"
    : "bg-rose-100 text-rose-800 hover:bg-rose-200";
}

export default function EventDetailsModal({
  isOpen,
  onClose,
  event,
  canSelfReportParticipation,
  currentParticipationStatus,
  isSavingParticipation,
  onParticipationChange,
}) {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl duration-200">
        <div className="relative shrink-0 bg-[#1E2761] p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <Icons.Close />
          </button>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
              <Icons.Events />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {event.event_name}
              </h2>
              {event.event_host && (
                <p className="font-medium text-blue-200">
                  Hosted by {event.event_host}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 sm:p-8">
          <div className="space-y-6">
            {event.event_description && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-[11px] font-black tracking-widest text-gray-400 uppercase">
                  About Event
                </h3>
                <p className="leading-relaxed whitespace-pre-wrap text-gray-700">
                  {event.event_description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Icons.Calendar />
                </div>
                <div>
                  <h3 className="mb-1 text-[11px] font-black tracking-widest text-gray-400 uppercase">
                    Event Date
                  </h3>
                  <p className="font-bold text-gray-900">
                    {formatEventDate(event.event_time)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="rounded-xl bg-red-50 p-3 text-red-600">
                  <Icons.Clock />
                </div>
                <div>
                  <h3 className="mb-1 text-[11px] font-black tracking-widest text-gray-400 uppercase">
                    Registration Deadline
                  </h3>
                  <p className="font-bold text-gray-900">
                    {formatEventDate(event.event_reg_deadline)}
                  </p>
                </div>
              </div>
            </div>

            {canSelfReportParticipation && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/10 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-[11px] font-black tracking-widest text-emerald-600 uppercase">
                  Update Participation Status
                </h3>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-gray-600">
                    Your Current Status:
                  </p>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-black tracking-wider uppercase ${getStatusBadgeClass(currentParticipationStatus)}`}
                  >
                    {getStatusLabel(currentParticipationStatus)}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      onParticipationChange(
                        event.$id,
                        PARTICIPATION_STATUS.PARTICIPATED,
                      )
                    }
                    disabled={
                      isSavingParticipation ||
                      currentParticipationStatus ===
                        PARTICIPATION_STATUS.PARTICIPATED
                    }
                    className={`rounded-xl px-4 py-3 text-xs font-black tracking-widest uppercase transition-all ${getParticipationButtonClass(currentParticipationStatus, PARTICIPATION_STATUS.PARTICIPATED)} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Mark Participated
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onParticipationChange(
                        event.$id,
                        PARTICIPATION_STATUS.NOT_PARTICIPATED,
                      )
                    }
                    disabled={
                      isSavingParticipation ||
                      currentParticipationStatus ===
                        PARTICIPATION_STATUS.NOT_PARTICIPATED
                    }
                    className={`rounded-xl px-4 py-3 text-xs font-black tracking-widest uppercase transition-all ${getParticipationButtonClass(currentParticipationStatus, PARTICIPATION_STATUS.NOT_PARTICIPATED)} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Mark Not Participated
                  </button>
                </div>
              </div>
            )}

            {event.event_url && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/30 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-center text-[11px] font-black tracking-widest text-blue-400 uppercase">
                  Ready to participate?
                </h3>
                <Link
                  href={event.event_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1E2761] px-8 py-4 text-lg font-bold text-white transition-all hover:bg-[#2d3a7d] hover:shadow-lg active:scale-95"
                >
                  Visit Event Destination
                  <Icons.ExternalLink />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
