/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  email: string | null;
  role: 'performer' | 'client' | 'admin';
  name: string;
  phone: string | null;
  region: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_ROUTES = ['/auth', '/login', '/register', '/forgot-password', '/reset-password'];

export function sanitizeNext(next: string | null | undefined): string {
  if (!next) return '/';
  if (!next.startsWith('/') || next.startsWith('//')) return '/';
  const lower = next.toLowerCase();
  if (AUTH_ROUTES.some((r) => lower === r || lower.startsWith(`${r}/`))) return '/';
  return next;
}

async function fetchProfile(user: User): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (!error && data) return data as Profile;

    // If profile doesn't exist yet (e.g. from Google OAuth), create default record
    const meta = user.user_metadata || {};
    const defaultProfile: Profile = {
      id: user.id,
      email: user.email ?? null,
      role: (meta.role as 'performer' | 'client' | 'admin') || 'client',
      name: (meta.name as string) || (meta.full_name as string) || user.email?.split('@')[0] || '사용자',
      phone: (meta.phone as string) || null,
      region: (meta.region as string) || '서울',
    };
    const { data: inserted } = await supabase
      .from('users')
      .upsert(defaultProfile, { onConflict: 'id' })
      .select()
      .maybeSingle();

    return (inserted as Profile) || defaultProfile;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(user);
    setProfile(p);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) {
        fetchProfile(data.session.user).then((p) => {
          if (mounted) setProfile(p);
        });
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).then((p) => {
          if (mounted) setProfile(p);
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}