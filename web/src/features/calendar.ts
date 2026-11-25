export function calendarEvent({ id, title, start, now = new Date() }: { id: string; title: string; start: Date; now?: Date }) {
  if (!Number.isFinite(start.getTime()) || start <= now) throw new Error('future-date-required');
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RuangJiwa//Calendar//ID', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${id.replace(/[^a-zA-Z0-9-]/g, '')}@ruangjiwa`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(new Date(start.getTime() + 15 * 60 * 1000))}`, `SUMMARY:${escape(title)}`, 'CLASS:PRIVATE', 'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:Pengingat pribadi', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'];
  return lines.join('\r\n') + '\r\n';
}
export function calendarUrl(content: string) { return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`; }
