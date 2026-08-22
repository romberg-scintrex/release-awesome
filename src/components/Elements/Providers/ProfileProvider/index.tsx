"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Profile } from "@/lib/types";

const ProfileContext = createContext<Profile | undefined>(undefined);

export function ProfileProvider({
  value,
  children,
}: {
  value: Profile;
  children: ReactNode;
}) {
  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): Profile | undefined {
  return useContext(ProfileContext);
}
