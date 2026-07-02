/**
 * Calendar export utilities.
 * Generates iCal (.ics) file content and Google Calendar URLs for match events.
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Generate a Google Calendar URL for a match event.
 * Opens Google Calendar with pre-filled event data.
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatDate = (d: Date): string =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startDate)}/${formatDate(event.endDate)}`,
    details: event.description ?? '',
    location: event.location ?? '',
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an iCal (.ics) file content string.
 * Can be downloaded as a file for import into any calendar app.
 */
export function generateICalFile(event: CalendarEvent): string {
  const formatDate = (d: Date): string =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').slice(0, 15) + 'Z';

  const uid = `match-${Date.now()}@olimpicapp`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OlimpicApp//Match//ES',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${formatDate(event.startDate)}`,
    `DTEND:${formatDate(event.endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description ?? ''}`,
    `LOCATION:${event.location ?? ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Download an iCal file for the given event.
 */
export function downloadICalFile(event: CalendarEvent): void {
  const content = generateICalFile(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Create a CalendarEvent from match data.
 */
export function matchToCalendarEvent(match: {
  homeTeamName?: string;
  awayTeamName?: string;
  scheduledAt?: string | null;
  venue?: string | null;
}, durationMinutes = 90): CalendarEvent | null {
  if (!match.scheduledAt) return null;

  const startDate = new Date(match.scheduledAt);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  return {
    title: `${match.homeTeamName ?? 'Local'} vs ${match.awayTeamName ?? 'Visitante'}`,
    description: 'Partido de torneo — OlimpicApp',
    location: match.venue ?? '',
    startDate,
    endDate,
  };
}
