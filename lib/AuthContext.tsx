"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string;
  createdAt: number;
}

export const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=300&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
];

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (userData: { name: string; email?: string; avatarUrl?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "aurafy_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Safe convex mutation
  let getOrCreateUserMut: any = null;
  let updateUserMut: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    getOrCreateUserMut = useMutation(api.users.getOrCreateUser);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    updateUserMut = useMutation(api.users.updateUser);
  } catch {}

  // Check persistent session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        setUser(parsed);

        // Sync with Convex in background
        if (getOrCreateUserMut && parsed.userId) {
          getOrCreateUserMut({
            userId: parsed.userId,
            name: parsed.name,
            email: parsed.email,
            avatarUrl: parsed.avatarUrl,
          }).catch(() => {});
        }
      } else {
        // No session found - redirect to one-time login if not already on login page
        if (pathname && pathname !== "/login") {
          router.replace("/login");
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Guard routes if not logged in
  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isLoading, user, pathname, router]);

  const login = async (userData: { name: string; email?: string; avatarUrl?: string }) => {
    const userId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const newProfile: UserProfile = {
      userId,
      name: userData.name.trim() || "Music Lover",
      email: userData.email?.trim() || `${userData.name.toLowerCase().replace(/\s+/g, ".")}@aurafy.app`,
      avatarUrl: userData.avatarUrl || DEFAULT_AVATARS[0],
      createdAt: Date.now(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
      setUser(newProfile);

      if (getOrCreateUserMut) {
        await getOrCreateUserMut({
          userId: newProfile.userId,
          name: newProfile.name,
          email: newProfile.email,
          avatarUrl: newProfile.avatarUrl,
        });
      }
    } catch (e) {
      console.warn("[Auth] Login error:", e);
    }

    router.replace("/");
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch {}
    router.replace("/login");
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      ...updates,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);

      if (updateUserMut) {
        await updateUserMut({
          userId: updated.userId,
          name: updated.name,
          email: updated.email,
          avatarUrl: updated.avatarUrl,
        });
      }
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
