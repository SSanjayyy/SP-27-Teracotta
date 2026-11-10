import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { ensureConfigured, fail } from '@/lib/playlists';
import { isDemoMode } from '@/lib/mockData';

// The one friendly reminder a day, for the Settings tab. Reminder prefs aren't pet stats, so the
// app saves them straight to the notification_prefs table (owner-only security rules).
// Sending the reminder itself isn't built yet; these are just the saved choices.

export type ReminderPrefs = {
  enabled: boolean;
  /** 0-23, in the user's own timezone. */
  reminderHour: number;
  /** No reminders from quietStart until quietEnd (hours 0-23). */
  quietStart: number;
  quietEnd: number;
  /** IANA name, e.g. 'America/New_York'. */
  timezone: string;
  expoPushToken: string | null;
};

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Defaults shown before the user has saved anything (matches the table defaults). */
export const DEFAULT_REMINDER_PREFS: ReminderPrefs = {
  enabled: true,
  reminderHour: 19,
  quietStart: 22,
  quietEnd: 8,
  timezone: 'UTC',
  expoPushToken: null,
};

let demoPrefs: ReminderPrefs | null = null;
const useLocalDemo = () => !isSupabaseConfigured && isDemoMode;

/** The saved reminder prefs, or the defaults (with this phone's timezone) if none are saved yet. */
export async function getReminderPrefs(): Promise<ReminderPrefs> {
  const defaults = { ...DEFAULT_REMINDER_PREFS, timezone: deviceTimezone() };
  if (useLocalDemo()) return demoPrefs ?? defaults;

  ensureConfigured();
  const { data, error } = await supabase
    .from('notification_prefs')
    .select('enabled, reminder_hour, quiet_start, quiet_end, timezone, expo_push_token')
    .maybeSingle();
  if (error) fail('load your reminder settings', error);
  if (!data) return defaults;
  return {
    enabled: data.enabled,
    reminderHour: data.reminder_hour,
    quietStart: data.quiet_start,
    quietEnd: data.quiet_end,
    timezone: data.timezone,
    expoPushToken: data.expo_push_token,
  };
}

/** Saves any of the reminder prefs (only the fields you pass change). Returns the saved prefs. */
export async function saveReminderPrefs(prefs: Partial<ReminderPrefs>): Promise<ReminderPrefs> {
  for (const hour of [prefs.reminderHour, prefs.quietStart, prefs.quietEnd]) {
    if (hour !== undefined && (!Number.isInteger(hour) || hour < 0 || hour > 23)) {
      throw new Error('Hours must be whole numbers from 0 to 23.');
    }
  }

  if (useLocalDemo()) {
    demoPrefs = { ...(await getReminderPrefs()), ...prefs };
    return demoPrefs;
  }

  ensureConfigured();
  const merged = { ...(await getReminderPrefs()), ...prefs };
  // user_id is filled in by the database (the logged-in user), so it isn't sent.
  const { error } = await supabase.from('notification_prefs').upsert(
    {
      enabled: merged.enabled,
      reminder_hour: merged.reminderHour,
      quiet_start: merged.quietStart,
      quiet_end: merged.quietEnd,
      timezone: merged.timezone,
      expo_push_token: merged.expoPushToken,
    },
    { onConflict: 'user_id' }
  );
  if (error) fail('save your reminder settings', error);
  return merged;
}
