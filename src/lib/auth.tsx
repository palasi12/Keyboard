import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { friendlyAuthError, isSupabaseConfigured, supabase } from './supabase';

interface AuthResult {
  ok: boolean;
  error?: string;
  /** Set when sign-up succeeded but the user must confirm their email. */
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  /** True until we know whether there is an existing session. */
  loading: boolean;
  configured: boolean;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string): Promise<AuthResult>;
  signInWithGoogle(): Promise<AuthResult>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED: AuthResult = {
  ok: false,
  error:
    'Sign-in is not connected yet. Add your Supabase URL and anon key to apps/web/.env.local.',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    // Restore an existing session before first paint of protected routes,
    // otherwise a refresh on /app bounces the user to /login for a frame.
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { ok: false, error: friendlyAuthError(error.message) } : { ok: true };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    if (error) return { ok: false, error: friendlyAuthError(error.message) };
    // No session back means the project has email confirmation switched on.
    return { ok: true, needsEmailConfirmation: data.session === null };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/account` },
    });
    return error ? { ok: false, error: friendlyAuthError(error.message) } : { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [session, loading, signIn, signUp, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
