export function parseEventDate(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const matchedDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matchedDate) {
      const year = Number(matchedDate[1]);
      const month = Number(matchedDate[2]);
      const day = Number(matchedDate[3]);
      return new Date(year, month - 1, day);
    }
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

export function formatEventDate(value) {
  const parsedDate = parseEventDate(value);
  if (!parsedDate) return "N/A";

  return parsedDate.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function getEventDeadlineDate(event) {
  return (
    parseEventDate(event?.event_reg_deadline) ||
    parseEventDate(event?.event_time)
  );
}

export function isNearDeadlineEvent(event, now = new Date()) {
  const regDeadline = parseEventDate(event?.event_reg_deadline);
  const eventDate = parseEventDate(event?.event_time);

  const isNear = (date) => {
    if (!date) return false;
    const diffInDays = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays >= 0 && diffInDays <= 2;
  };

  return isNear(regDeadline) || isNear(eventDate);
}

export function isCompletedDeadlineEvent(event, now = new Date()) {
  const eventDate = parseEventDate(event?.event_time);
  if (eventDate) {
    return eventDate.getTime() < now.getTime();
  }

  const deadline = parseEventDate(event?.event_reg_deadline);
  return deadline ? deadline.getTime() < now.getTime() : false;
}
