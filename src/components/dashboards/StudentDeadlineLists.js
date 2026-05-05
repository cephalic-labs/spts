"use client";

import { Icons } from "@/components/layout";
import {
  formatEventDate,
  isCompletedDeadlineEvent,
  isNearDeadlineEvent,
} from "@/lib/utils/eventDates";

function sortBySoonestDeadline(a, b) {
  const aDate = new Date(
    a.event_reg_deadline || a.event_time || a.$createdAt || 0,
  ).getTime();
  const bDate = new Date(
    b.event_reg_deadline || b.event_time || b.$createdAt || 0,
  ).getTime();
  return aDate - bDate;
}

function sortByRecentCompletion(a, b) {
  const aDate = new Date(
    a.event_time || a.event_reg_deadline || a.$createdAt || 0,
  ).getTime();
  const bDate = new Date(
    b.event_time || b.event_reg_deadline || b.$createdAt || 0,
  ).getTime();
  return bDate - aDate;
}

function DeadlineSection({
  title,
  subtitle,
  badge,
  events,
  emptyMessage,
  accentClasses,
  onViewEvent,
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
        </div>
        <div
          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${accentClasses}`}
        >
          {badge}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-slate-600">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <article
              key={event.$id}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h3 className="line-clamp-2 text-base font-bold text-slate-900 sm:text-lg">
                      {event.event_name}
                    </h3>
                    <span className="inline-flex items-center rounded-full border border-indigo-100 bg-white px-3 py-1 text-[11px] font-black tracking-wider text-indigo-700 uppercase">
                      {badge}
                    </span>
                  </div>
                  {event.event_host && (
                    <p className="mb-3 text-sm font-medium text-slate-500">
                      Hosted by {event.event_host}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2">
                      <Icons.Calendar />
                      <span className="font-semibold text-slate-400">
                        Event:
                      </span>
                      <span>{formatEventDate(event.event_time)}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2">
                      <Icons.Clock />
                      <span className="font-semibold text-slate-400">
                        Deadline:
                      </span>
                      <span>{formatEventDate(event.event_reg_deadline)}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 lg:w-40">
                  <button
                    type="button"
                    onClick={() => onViewEvent(event)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1E2761] px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#2d3a7d] hover:shadow-lg"
                  >
                    View
                    <Icons.Eye />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentDeadlineLists({ events, onViewEvent }) {
  const nearDeadlineEvents = events
    .filter((event) => isNearDeadlineEvent(event))
    .sort(sortBySoonestDeadline);

  const completedDeadlineEvents = events
    .filter((event) => isCompletedDeadlineEvent(event))
    .sort(sortByRecentCompletion);

  return (
    <div className="space-y-6">
      <DeadlineSection
        title="Near Deadlines"
        subtitle="Events with deadlines coming up soon"
        badge="Upcoming"
        events={nearDeadlineEvents}
        emptyMessage="No events are nearing a deadline right now."
        accentClasses="bg-indigo-50 text-indigo-700 border-indigo-100"
        onViewEvent={onViewEvent}
      />
      <DeadlineSection
        title="Completed Deadlines"
        subtitle="Events whose timelines have already passed"
        badge="Completed"
        events={completedDeadlineEvents}
        emptyMessage="No completed deadline events to show yet."
        accentClasses="bg-slate-100 text-slate-700 border-slate-200"
        onViewEvent={onViewEvent}
      />
    </div>
  );
}
