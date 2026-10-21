/**
 * Utilidades para formatear fechas y nombres de días en español
 * Maneja cadenas ISO 'YYYY-MM-DD' de manera determinista sin desfasar la zona horaria
 */

const DAYS_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/**
 * Obtiene el nombre del día de la semana para una fecha 'YYYY-MM-DD'
 * @example getDayOfWeekName('2026-10-14') => 'Miércoles'
 */
export function getDayOfWeekName(dateStr?: string): string {
  if (!dateStr || !dateStr.includes('-')) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return '';
  }
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  return DAYS_ES[dateObj.getDay()] || '';
}

/**
 * Formatea una fecha con su nombre de día y formato legible
 * @example formatDateWithDay('2026-10-14') => 'Miércoles 14/10'
 */
export function formatDateWithDay(dateStr?: string): string {
  if (!dateStr) return '';
  const dayName = getDayOfWeekName(dateStr);
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const day = parts[2];
  const month = parts[1];
  return dayName ? `${dayName} ${day}/${month}` : dateStr;
}

/**
 * Formato largo con nombre de día
 * @example formatDateLongWithDay('2026-10-14') => 'Miércoles, 14 de Octubre de 2026'
 */
export function formatDateLongWithDay(dateStr?: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr || '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3) return dateStr;
  const dayName = getDayOfWeekName(dateStr);
  const day = parts[2];
  const monthName = MONTHS_ES[parts[1] - 1] || parts[1];
  const year = parts[0];
  return `${dayName}, ${day} de ${monthName} de ${year}`;
}

export function formatTime12Hour(timeStr?: string): string {
  if (!timeStr) return '';
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeStr);
  if (!match) return timeStr;

  const hour = Number(match[1]);
  const displayHour = hour % 12 || 12;
  const period = hour < 12 ? 'a. m.' : 'p. m.';
  return `${displayHour}:${match[2]} ${period}`;
}

export function formatDurationInHours(durationMinutes: number): string {
  const hours = durationMinutes / 60;
  const formattedHours = new Intl.NumberFormat('es', {
    maximumFractionDigits: 2,
  }).format(hours);
  return `${formattedHours} ${hours === 1 ? 'hora' : 'horas'}`;
}

export function formatTimeRange12Hour(
  startTime: string,
  durationMinutes: number
): string | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(startTime);
  if (!match || !Number.isInteger(durationMinutes) || durationMinutes < 0) return null;

  const startMinutes = Number(match[1]) * 60 + Number(match[2]);
  const endMinutes = startMinutes + durationMinutes;
  const endTime = `${String(Math.floor((endMinutes % 1440) / 60)).padStart(2, '0')}:${String(
    endMinutes % 60
  ).padStart(2, '0')}`;
  const daysLater = Math.floor(endMinutes / 1440);
  const nextDayLabel =
    daysLater === 1 ? ' (día siguiente)' : daysLater > 1 ? ` (+${daysLater} días)` : '';

  return `${formatTime12Hour(startTime)} – ${formatTime12Hour(endTime)}${nextDayLabel}`;
}

export function compareDateTimeDescending(
  a: { date: string; time: string },
  b: { date: string; time: string }
): number {
  return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
}
