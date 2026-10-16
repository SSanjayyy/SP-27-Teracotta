
import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthResult = {
  error: string | null;
  needsEmailConfirmation?: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isSignedIn: boolean;
  isDevBypass: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
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

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          console.error('Unable to restore session:', error.message);
        }

        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { error: NOT_CONFIGURED };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    return { error: error?.message ?? null };
  };

  const signUp = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { error: NOT_CONFIGURED };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return {
      error: null,
      needsEmailConfirmation: !data.session,
    };
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { error: NOT_CONFIGURED };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim()
    );

    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    setIsDevBypass(false);

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    }
  };

  const enterDevBypass = () => {
    if (__DEV__ && !isSupabaseConfigured) {
      setIsDevBypass(true);
    }
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
        resetPassword,
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

  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }

  return ctx;
}
