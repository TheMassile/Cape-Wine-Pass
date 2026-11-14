import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from './supabase';

type AuthState = {
  session: Session | null;
  loading: boolean;
  // Has this person picked a handle yet? null while we check.
  hasProfile: boolean | null;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  hasProfile: null,
  refreshProfile: async () => {},
});

async function checkProfile(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('handle')
    .eq('user_id', userId)
    .maybeSingle();
  // If the check itself fails (e.g. no signal), don't trap people on the set-up screen.
  if (error) return true;
  return !!data?.handle;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    checkProfile(userId).then((ok) => {
      if (!cancelled) setHasProfile(ok);
    });
    return () => {
      cancelled = true;
      setHasProfile(null);
    };
  }, [userId]);

  const refreshProfile = useCallback(async () => {
    if (userId) setHasProfile(await checkProfile(userId));
  }, [userId]);

  return (
    <AuthContext.Provider value={{ session, loading, hasProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
