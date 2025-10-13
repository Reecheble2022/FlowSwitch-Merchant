import type { PromptScheduleRule, PromptPreview } from '../types';

export function generateScheduleDates(
  rule: PromptScheduleRule,
  startDate: string,
  endDate: string
): PromptPreview {
  const dates: string[] = [];
  const warnings: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options = rule.options || {};
  const quietHours = options.quietHours !== false;
  const skipWeekends = options.skipWeekends === true;

  switch (rule.type) {
    case 'one_time':
      dates.push(formatScheduleTime(start, rule.sendTime, rule.randomWindow));
      break;

    case 'times_total':
      if (!rule.timesTotal || rule.timesTotal < 1) {
        warnings.push('Invalid times_total value');
        break;
      }
      generateEvenlySpaced(dates, start, end, rule.timesTotal, rule.sendTime, rule.randomWindow);
      break;

    case 'every_n_days':
      if (!rule.everyNDays || rule.everyNDays < 1) {
        warnings.push('Invalid everyNDays value');
        break;
      }
      generateEveryNDays(dates, start, end, rule.everyNDays, rule.sendTime, rule.randomWindow);
      break;
  }

  const filtered = applyRules(dates, quietHours, skipWeekends, warnings);

  return {
    dates: filtered.slice(0, 5),
    count: filtered.length,
    warnings,
  };
}

function generateEvenlySpaced(
  dates: string[],
  start: Date,
  end: Date,
  count: number,
  sendTime?: string,
  randomWindow?: { start: string; end: string }
) {
  const totalMs = end.getTime() - start.getTime();
  const interval = totalMs / (count - 1 || 1);

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(start.getTime() + interval * i);
    dates.push(formatScheduleTime(timestamp, sendTime, randomWindow));
  }
}

function generateEveryNDays(
  dates: string[],
  start: Date,
  end: Date,
  everyNDays: number,
  sendTime?: string,
  randomWindow?: { start: string; end: string }
) {
  let current = new Date(start);

  while (current <= end) {
    dates.push(formatScheduleTime(current, sendTime, randomWindow));
    current = new Date(current.getTime() + everyNDays * 24 * 60 * 60 * 1000);
  }
}

function formatScheduleTime(
  date: Date,
  sendTime?: string,
  randomWindow?: { start: string; end: string }
): string {
  const d = new Date(date);

  if (randomWindow) {
    const [startHour, startMin] = randomWindow.start.split(':').map(Number);
    const [endHour, endMin] = randomWindow.end.split(':').map(Number);

    const startMins = startHour * 60 + startMin;
    const endMins = endHour * 60 + endMin;
    const randomMins = Math.floor(Math.random() * (endMins - startMins)) + startMins;

    d.setHours(Math.floor(randomMins / 60), randomMins % 60, 0, 0);
  } else if (sendTime) {
    const [hour, minute] = sendTime.split(':').map(Number);
    d.setHours(hour, minute, 0, 0);
  } else {
    d.setHours(9, 0, 0, 0);
  }

  return d.toISOString();
}

function applyRules(
  dates: string[],
  quietHours: boolean,
  skipWeekends: boolean,
  warnings: string[]
): string[] {
  return dates.filter((dateStr) => {
    const date = new Date(dateStr);
    const hour = date.getHours();
    const day = date.getDay();

    if (quietHours && (hour < 6 || hour >= 22)) {
      warnings.push(`Adjusted ${dateStr} due to quiet hours`);
      const adjusted = new Date(date);
      if (hour < 6) {
        adjusted.setHours(9, 0, 0, 0);
      } else {
        adjusted.setHours(21, 0, 0, 0);
      }
      return false;
    }

    if (skipWeekends && (day === 0 || day === 6)) {
      warnings.push(`Skipped ${dateStr} (weekend)`);
      return false;
    }

    return true;
  });
}

export function validateSchedule(
  rule: PromptScheduleRule,
  startDate: string,
  endDate: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    errors.push('Invalid start date');
  }

  if (isNaN(end.getTime())) {
    errors.push('Invalid end date');
  }

  if (start >= end) {
    errors.push('End date must be after start date');
  }

  if (rule.type === 'times_total' && (!rule.timesTotal || rule.timesTotal < 1)) {
    errors.push('times_total must be >= 1');
  }

  if (rule.type === 'every_n_days' && (!rule.everyNDays || rule.everyNDays < 1)) {
    errors.push('everyNDays must be >= 1');
  }

  if (rule.sendTime) {
    const timeMatch = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(rule.sendTime);
    if (!timeMatch) {
      errors.push('sendTime must be in HH:MM format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
