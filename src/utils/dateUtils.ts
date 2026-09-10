/**
 * Utility functions for parsing French dates and synchronizing
 * weekly menu dates chronologically across Monday to Friday.
 */

export interface ParsedDate {
  day: number;
  month: number; // 1 to 12
  year: number;
  isTextFormat?: boolean; // true if written like "31 Août"
  hasLeadingZero?: boolean;
}

export const FRENCH_MONTHS = [
  { name: 'Janvier', short: 'Janv', num: 1, aliases: ['janvier', 'janv', 'jan'] },
  { name: 'Février', short: 'Févr', num: 2, aliases: ['février', 'fevrier', 'févr', 'fevr', 'fev'] },
  { name: 'Mars', short: 'Mars', num: 3, aliases: ['mars', 'mar'] },
  { name: 'Avril', short: 'Avr', num: 4, aliases: ['avril', 'avr'] },
  { name: 'Mai', short: 'Mai', num: 5, aliases: ['mai'] },
  { name: 'Juin', short: 'Juin', num: 6, aliases: ['juin'] },
  { name: 'Juillet', short: 'Juil', num: 7, aliases: ['juillet', 'juil', 'jul'] },
  { name: 'Août', short: 'Août', num: 8, aliases: ['août', 'aout'] },
  { name: 'Septembre', short: 'Sept', num: 9, aliases: ['septembre', 'sept', 'sep'] },
  { name: 'Octobre', short: 'Oct', num: 10, aliases: ['octobre', 'oct'] },
  { name: 'Novembre', short: 'Nov', num: 11, aliases: ['novembre', 'nov'] },
  { name: 'Décembre', short: 'Déc', num: 12, aliases: ['décembre', 'decembre', 'déc', 'dec'] },
];

/**
 * Parses a French date string into day, month, and year.
 * Examples supported:
 * - "31 Août", "31 aout", "1er Septembre", "1 Septembre"
 * - "31/08", "31/8", "31-08", "31.08", "31/08/2026"
 * - "2026-08-31" (ISO)
 * - "Lundi 31 Août", "Du 31 Août"
 * - "15 au 19 Septembre" -> extracts start day 15 and month 9
 */
export function parseFrenchDate(input: string, fallbackYear?: number | string): ParsedDate | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const currentYear = fallbackYear ? parseInt(String(fallbackYear), 10) || new Date().getFullYear() : new Date().getFullYear();

  // Strip prefixes like "du", "le", "lundi", "au", "vendredi", etc.
  let cleaned = trimmed
    .toLowerCase()
    .replace(/^(du|au|le|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+/i, '')
    .trim();

  // Range support: "15 au 19 Septembre" or "15 - 19 Septembre"
  const rangeMatch = cleaned.match(/^(\d{1,2}|1er)\s*(?:au|-|à)\s*(\d{1,2}|1er)\s+([a-zA-ZÀ-ÿ]+)(?:\s+(\d{4}))?$/i);
  if (rangeMatch) {
    const dStr = rangeMatch[1].toLowerCase();
    const d = dStr === '1er' ? 1 : parseInt(dStr, 10);
    const monthWord = rangeMatch[3].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let y = currentYear;
    if (rangeMatch[4]) {
      y = parseInt(rangeMatch[4], 10);
    }
    const foundMonth = FRENCH_MONTHS.find((m) => {
      return m.aliases.some((alias) => {
        const cleanAlias = alias.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return cleanAlias === monthWord || monthWord.startsWith(cleanAlias);
      });
    });
    if (foundMonth && d >= 1 && d <= 31) {
      return {
        day: d,
        month: foundMonth.num,
        year: y,
        isTextFormat: true,
        hasLeadingZero: rangeMatch[1].length === 2 && rangeMatch[1].startsWith('0'),
      };
    }
  }

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { day: d, month: m, year: y, isTextFormat: false, hasLeadingZero: isoMatch[3].startsWith('0') };
    }
  }

  // 2. Numeric format: DD/MM/YYYY or DD/MM or DD-MM or DD.MM
  const numMatch = cleaned.match(/^(\d{1,2})[\/\.\-](\d{1,2})(?:[\/\.\-](\d{2,4}))?$/);
  if (numMatch) {
    const d = parseInt(numMatch[1], 10);
    const m = parseInt(numMatch[2], 10);
    let y = currentYear;
    if (numMatch[3]) {
      const parsedY = parseInt(numMatch[3], 10);
      y = parsedY < 100 ? 2000 + parsedY : parsedY;
    }
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return {
        day: d,
        month: m,
        year: y,
        isTextFormat: false,
        hasLeadingZero: numMatch[1].length === 2 && numMatch[1].startsWith('0'),
      };
    }
  }

  // 3. Text format: "31 Août", "1er Septembre", "4 Septembre 2026", "15 sept"
  const textMatch = cleaned.match(/^(\d{1,2}|1er)\s+([a-zA-ZÀ-ÿ]+)(?:\s+(\d{4}))?$/i);
  if (textMatch) {
    const dayStr = textMatch[1].toLowerCase();
    const d = dayStr === '1er' ? 1 : parseInt(dayStr, 10);
    const monthWord = textMatch[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let y = currentYear;
    if (textMatch[3]) {
      y = parseInt(textMatch[3], 10);
    }

    const foundMonth = FRENCH_MONTHS.find((m) => {
      return m.aliases.some((alias) => {
        const cleanAlias = alias.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return cleanAlias === monthWord || monthWord.startsWith(cleanAlias);
      });
    });

    if (foundMonth && d >= 1 && d <= 31) {
      return {
        day: d,
        month: foundMonth.num,
        year: y,
        isTextFormat: true,
        hasLeadingZero: textMatch[1].length === 2 && textMatch[1].startsWith('0'),
      };
    }
  }

  return null;
}

/**
 * Format day and month as standard French string:
 * e.g., formatFrenchDayMonth(31, 8, true) -> "31 Août"
 * e.g., formatFrenchDayMonth(4, 9, true, true) -> "04 Septembre"
 */
export function formatFrenchDayMonth(day: number, month: number, isText = true, padZero = false): string {
  const dStr = padZero ? String(day).padStart(2, '0') : String(day);
  if (isText) {
    const monthObj = FRENCH_MONTHS[month - 1] || FRENCH_MONTHS[0];
    return `${dStr} ${monthObj.name}`;
  }
  const mStr = String(month).padStart(2, '0');
  return `${String(day).padStart(2, '0')}/${mStr}`;
}

/**
 * Formats a Date object to "DD/MM" (used for individual Day cards)
 */
export function formatDateToDayMonth(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
}

/**
 * Formats a Date object to "YYYY-MM-DD" for HTML date inputs
 */
export function formatDateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface ComputedWeekDays {
  monday: string;    // "DD/MM"
  tuesday: string;   // "DD/MM"
  wednesday: string; // "DD/MM"
  thursday: string;  // "DD/MM"
  friday: string;    // "DD/MM"
  startDateCover: string; // formatted matching user's style
  endDateCover: string;   // formatted matching user's style
  year: string;
  mondayIso: string;      // YYYY-MM-DD for date input
}

/**
 * Calculates all 5 week days chronologically given a start date (Monday)
 * and optional format style.
 */
export function computeWeekDaysFromStartDate(
  startDateInput: string,
  yearInput?: string
): ComputedWeekDays | null {
  const parsed = parseFrenchDate(startDateInput, yearInput);
  if (!parsed) return null;

  const { day, month, year, isTextFormat, hasLeadingZero } = parsed;
  // Monday is day offset 0
  const mondayDate = new Date(year, month - 1, day);

  const tuesdayDate = new Date(year, month - 1, day + 1);
  const wednesdayDate = new Date(year, month - 1, day + 2);
  const thursdayDate = new Date(year, month - 1, day + 3);
  const fridayDate = new Date(year, month - 1, day + 4);

  const startFormattedCover = isTextFormat
    ? formatFrenchDayMonth(mondayDate.getDate(), mondayDate.getMonth() + 1, true, hasLeadingZero)
    : formatDateToDayMonth(mondayDate);

  const endFormattedCover = isTextFormat
    ? formatFrenchDayMonth(fridayDate.getDate(), fridayDate.getMonth() + 1, true, hasLeadingZero)
    : formatDateToDayMonth(fridayDate);

  return {
    monday: formatDateToDayMonth(mondayDate),
    tuesday: formatDateToDayMonth(tuesdayDate),
    wednesday: formatDateToDayMonth(wednesdayDate),
    thursday: formatDateToDayMonth(thursdayDate),
    friday: formatDateToDayMonth(fridayDate),
    startDateCover: startFormattedCover,
    endDateCover: endFormattedCover,
    year: String(fridayDate.getFullYear() || year),
    mondayIso: formatDateToIso(mondayDate),
  };
}

/**
 * Calculates all 5 week days chronologically backwards given an end date (Friday).
 */
export function computeWeekDaysFromEndDate(
  endDateInput: string,
  yearInput?: string
): ComputedWeekDays | null {
  const parsed = parseFrenchDate(endDateInput, yearInput);
  if (!parsed) return null;

  const { day, month, year, isTextFormat, hasLeadingZero } = parsed;
  // Friday is day offset 0
  const fridayDate = new Date(year, month - 1, day);

  const thursdayDate = new Date(year, month - 1, day - 1);
  const wednesdayDate = new Date(year, month - 1, day - 2);
  const tuesdayDate = new Date(year, month - 1, day - 3);
  const mondayDate = new Date(year, month - 1, day - 4);

  const startFormattedCover = isTextFormat
    ? formatFrenchDayMonth(mondayDate.getDate(), mondayDate.getMonth() + 1, true, hasLeadingZero)
    : formatDateToDayMonth(mondayDate);

  const endFormattedCover = isTextFormat
    ? formatFrenchDayMonth(fridayDate.getDate(), fridayDate.getMonth() + 1, true, hasLeadingZero)
    : formatDateToDayMonth(fridayDate);

  return {
    monday: formatDateToDayMonth(mondayDate),
    tuesday: formatDateToDayMonth(tuesdayDate),
    wednesday: formatDateToDayMonth(wednesdayDate),
    thursday: formatDateToDayMonth(thursdayDate),
    friday: formatDateToDayMonth(fridayDate),
    startDateCover: startFormattedCover,
    endDateCover: endFormattedCover,
    year: String(fridayDate.getFullYear() || year),
    mondayIso: formatDateToIso(mondayDate),
  };
}

/**
 * Given a Monday Date object, returns the ComputedWeekDays.
 */
export function computeWeekDaysFromMondayDate(
  mondayDate: Date,
  preferTextFormat = true
): ComputedWeekDays {
  const year = mondayDate.getFullYear();
  const mDay = mondayDate.getDate();
  const mMonth = mondayDate.getMonth();

  const tuesdayDate = new Date(year, mMonth, mDay + 1);
  const wednesdayDate = new Date(year, mMonth, mDay + 2);
  const thursdayDate = new Date(year, mMonth, mDay + 3);
  const fridayDate = new Date(year, mMonth, mDay + 4);

  return {
    monday: formatDateToDayMonth(mondayDate),
    tuesday: formatDateToDayMonth(tuesdayDate),
    wednesday: formatDateToDayMonth(wednesdayDate),
    thursday: formatDateToDayMonth(thursdayDate),
    friday: formatDateToDayMonth(fridayDate),
    startDateCover: preferTextFormat
      ? formatFrenchDayMonth(mondayDate.getDate(), mondayDate.getMonth() + 1, true, true)
      : formatDateToDayMonth(mondayDate),
    endDateCover: preferTextFormat
      ? formatFrenchDayMonth(fridayDate.getDate(), fridayDate.getMonth() + 1, true, true)
      : formatDateToDayMonth(fridayDate),
    year: String(fridayDate.getFullYear()),
    mondayIso: formatDateToIso(mondayDate),
  };
}

/**
 * Gets the Monday of the current week (or offset by weeks)
 */
export function getMondayOfWeek(offsetWeeks = 0): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Dimanche, 1 = Lundi, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + (offsetWeeks * 7));
  return monday;
}
