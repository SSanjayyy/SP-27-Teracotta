import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

/** False until someone creates syncd-app/.env with the Supabase URL + key. */
export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') && supabaseKey.length > 0;

// Placeholder values keep the app booting before .env exists; every auth call
// checks isSupabaseConfigured first, so nothing is ever sent to them.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseKey : 'placeholder-key',
  {
    auth: {
      // AsyncStorage keeps the session on the device, so people stay logged in
      // after closing and reopening the app. (On web it falls back to localStorage.)
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Only refresh the auth token while the app is in the foreground.
// Recommended by Supabase for React Native.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (!isSupabaseConfigured) return;
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
