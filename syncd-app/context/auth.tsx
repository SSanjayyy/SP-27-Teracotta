import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthResult = { error: string | null; needsEmailConfirmation?: boolean };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  /** True until the saved session (if any) has been read from storage. */
  loading: boolean;
  /** True when someone is signed in — or using the dev bypass before Supabase is set up. */
  isSignedIn: boolean;
  /** True while using "Continue without account" (dev only, no Supabase key yet). */
  isDevBypass: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  enterDevBypass: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED =
  'Supabase is not configured yet. Add syncd-app/.env (see .env.example) and restart Expo.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [isDevBypass, setIsDevBypass] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // 1. Restore the session saved on the device (this is what keeps people
    //    logged in when they reopen the app).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // 2. Keep in sync with sign in / sign out / token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) return { error: error.message };
    // If "Confirm email" is on in Supabase, there's no session until they click the link.
    return { error: null, needsEmailConfirmation: !data.session };
  };

  const signOut = async () => {
    setIsDevBypass(false);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  };

  const enterDevBypass = () => {
    if (__DEV__ && !isSupabaseConfigured) setIsDevBypass(true);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isSignedIn: !!session || isDevBypass,
        isDevBypass,
        signIn,
        signUp,
        signOut,
        enterDevBypass,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
