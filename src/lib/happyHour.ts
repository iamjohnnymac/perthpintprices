// Happy Hour Parser Utility
// Parses happy hour strings like "Daily 4-7pm", "Mon-Fri 5-7pm" into structured data
// and calculates countdown/status for display

export interface ParsedHappyHour {
  days: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startHour: number; // 24-hour format
  endHour: number; // 24-hour format
  raw: string; // Original string
}

export interface HappyHourStatus {
  isActive: boolean;
  isToday: boolean;
  statusText: string;
  statusEmoji: string;
  countdown: string | null;
}

const DAY_MAP: Record<string, number> = {
  'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Parse a happy hour string into structured data
 * Handles formats like: "Daily 4-7pm", "Mon-Fri 5-7pm", "Wed-Sun 4-6pm"
 */
export function parseHappyHour(happyHourStr: string | null): ParsedHappyHour | null {
  if (!happyHourStr) return null;

  // Pattern: "Daily 4-7pm" or "Mon-Fri 5-7pm"
  const regex = /^(Daily|([A-Za-z]{3})-([A-Za-z]{3}))\s+(\d{1,2})-(\d{1,2})(am|pm)$/i;
  const match = happyHourStr.match(regex);
  
  if (!match) return null;

  const [, dayPart, startDay, endDay, startHourStr, endHourStr, ampm] = match;
  
  // Parse days
  let days: number[];
  if (dayPart.toLowerCase() === 'daily') {
    days = [0, 1, 2, 3, 4, 5, 6]; // All days
  } else {
    const startDayNum = DAY_MAP[startDay];
    const endDayNum = DAY_MAP[endDay];
    if (startDayNum === undefined || endDayNum === undefined) return null;
    
    // Handle day ranges (e.g., Wed-Sun wraps around)
    days = [];
    let current = startDayNum;
    while (true) {
      days.push(current);
      if (current === endDayNum) break;
      current = (current + 1) % 7;
    }
  }

  // Parse hours (convert to 24-hour format)
  let startHour = parseInt(startHourStr);
  let endHour = parseInt(endHourStr);
  
  if (ampm.toLowerCase() === 'pm') {
    if (startHour !== 12) startHour += 12;
    if (endHour !== 12) endHour += 12;
  } else {
    if (startHour === 12) startHour = 0;
    if (endHour === 12) endHour = 0;
  }

  return {
    days,
    startHour,
    endHour,
    raw: happyHourStr
  };
}

/**
 * Get the current happy hour status for display
 * Uses Perth timezone (Australia/Perth = GMT+8)
 */
export function getHappyHourStatus(happyHourStr: string | null | undefined): HappyHourStatus {
  if (!happyHourStr) {
    return {
      isActive: false,
      isToday: false,
      statusText: 'No happy hour',
      statusEmoji: '',
      countdown: null
    };
  }

  const parsed = parseHappyHour(happyHourStr);
  
  // Can't parse - return text-only fallback
  if (!parsed) {
    return {
      isActive: false,
      isToday: false,
      statusText: happyHourStr,
      statusEmoji: '🕐',
      countdown: null
    };
  }

  // Get current time in Perth
  const now = new Date();
  const perthTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Perth' }));
  const currentDay = perthTime.getDay(); // 0 = Sunday
  const currentHour = perthTime.getHours();
  const currentMinute = perthTime.getMinutes();
  const currentTimeDecimal = currentHour + currentMinute / 60;

  const isHappyHourDay = parsed.days.includes(currentDay);
  const isWithinHours = currentTimeDecimal >= parsed.startHour && currentTimeDecimal < parsed.endHour;
  
  // Currently active!
  if (isHappyHourDay && isWithinHours) {
    const minutesRemaining = Math.floor((parsed.endHour - currentTimeDecimal) * 60);
    const hours = Math.floor(minutesRemaining / 60);
    const mins = minutesRemaining % 60;
    const countdown = hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
    
    return {
      isActive: true,
      isToday: true,
      statusText: 'Happy Hour NOW!',
      statusEmoji: '●',
      countdown
    };
  }

  // Today but not yet started
  if (isHappyHourDay && currentTimeDecimal < parsed.startHour) {
    const minutesUntil = Math.floor((parsed.startHour - currentTimeDecimal) * 60);
    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    const countdown = hours > 0 ? `in ${hours}h ${mins}m` : `in ${mins}m`;
    
    return {
      isActive: false,
      isToday: true,
      statusText: `Happy Hour ${countdown}`,
      statusEmoji: '⏰',
      countdown
    };
  }

  // Today but already ended, or not a happy hour day
  const nextDay = findNextHappyHourDay(parsed.days, currentDay);
  const daysUntil = (nextDay - currentDay + 7) % 7;
  
  if (daysUntil === 0 && currentTimeDecimal >= parsed.endHour) {
    // Today ended, find next occurrence
    const nextOccurrence = findNextHappyHourDay(parsed.days, currentDay);
    const daysToNext = (nextOccurrence - currentDay + 7) % 7 || 7; // At least tomorrow
    
    if (daysToNext === 1) {
      return {
        isActive: false,
        isToday: false,
        statusText: `Tomorrow ${formatHour(parsed.startHour)}`,
        statusEmoji: '📅',
        countdown: null
      };
    }
    return {
      isActive: false,
      isToday: false,
      statusText: `${DAY_NAMES[nextOccurrence]} ${formatHour(parsed.startHour)}`,
      statusEmoji: '📅',
      countdown: null
    };
  }
  
  if (daysUntil === 1) {
    return {
      isActive: false,
      isToday: false,
      statusText: `Tomorrow ${formatHour(parsed.startHour)}`,
      statusEmoji: '📅',
      countdown: null
    };
  }
  
  return {
    isActive: false,
    isToday: false,
    statusText: `${DAY_NAMES[nextDay]} ${formatHour(parsed.startHour)}`,
    statusEmoji: '📅',
    countdown: null
  };
}

function findNextHappyHourDay(happyDays: number[], currentDay: number): number {
  // Start from tomorrow
  for (let i = 1; i <= 7; i++) {
    const checkDay = (currentDay + i) % 7;
    if (happyDays.includes(checkDay)) {
      return checkDay;
    }
  }
  return currentDay; // Fallback (shouldn't happen)
}

function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}
