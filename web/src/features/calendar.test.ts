import { it, expect } from 'vitest';
import { calendarEvent } from './calendar';
it('exports a future private-neutral calendar event with UTC times, escaped fields and calendar-owned alert', () => {
  const ics = calendarEvent({ id: 'mood-1', title: 'Catat mood, pribadi; aman\nbaris', start: new Date('2026-01-02T10:00:00Z'), now: new Date('2026-01-01Z') });
  expect(ics).toContain('BEGIN:VCALENDAR\r\n'); expect(ics).toContain('DTSTART:20260102T100000Z'); expect(ics).toContain('DTEND:20260102T101500Z'); expect(ics).toContain('SUMMARY:Catat mood\\, pribadi\\; aman\\nbaris'); expect(ics).toContain('TRIGGER:-PT15M'); expect(ics).toContain('CLASS:PRIVATE'); expect(ics).not.toContain('userId'); expect(() => calendarEvent({ id: 'x', title: 'x', start: new Date('2025-01-01'), now: new Date('2026-01-01') })).toThrow();
});
