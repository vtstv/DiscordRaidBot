// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Constants and shared data for settings command

export const COMMON_TIMEZONES = [
  // Americas
  { name: 'Pacific Time - Los Angeles', value: 'America/Los_Angeles' },
  { name: 'Mountain Time - Denver', value: 'America/Denver' },
  { name: 'Central Time - Chicago', value: 'America/Chicago' },
  { name: 'Eastern Time - New York', value: 'America/New_York' },
  { name: 'Atlantic Time - Halifax', value: 'America/Halifax' },
  { name: 'Brazil Time - São Paulo', value: 'America/Sao_Paulo' },
  { name: 'Argentina - Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
  // Europe
  { name: 'Western Europe - London', value: 'Europe/London' },
  { name: 'Central Europe - Berlin', value: 'Europe/Berlin' },
  { name: 'Eastern Europe - Bucharest', value: 'Europe/Bucharest' },
  { name: 'Russia - Moscow', value: 'Europe/Moscow' },
  { name: 'Turkey - Ankara', value: 'Europe/Istanbul' },
  // Asia
  { name: 'India - Kolkata', value: 'Asia/Kolkata' },
  { name: 'Bangladesh - Dhaka', value: 'Asia/Dhaka' },
  { name: 'China - Shanghai', value: 'Asia/Shanghai' },
  { name: 'Japan - Tokyo', value: 'Asia/Tokyo' },
  { name: 'Korea - Seoul', value: 'Asia/Seoul' },
  { name: 'Singapore', value: 'Asia/Singapore' },
  { name: 'Thailand - Bangkok', value: 'Asia/Bangkok' },
  { name: 'UAE - Dubai', value: 'Asia/Dubai' },
  // Australia & Pacific
  { name: 'Australia - Sydney', value: 'Australia/Sydney' },
  { name: 'Australia - Melbourne', value: 'Australia/Melbourne' },
  { name: 'Australia - Perth', value: 'Australia/Perth' },
  { name: 'New Zealand - Auckland', value: 'Pacific/Auckland' },
  // UTC offsets
  { name: 'UTC', value: 'UTC' },
  { name: 'GMT', value: 'GMT' },
];

/**
 * Get current time in timezone for autocomplete display
 */
export function getCurrentTime(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(now);
  } catch {
    return 'Invalid';
  }
}
