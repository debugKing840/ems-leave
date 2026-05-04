import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) redirect("/login");

  return data as Profile;
}

export function canManageLeave(role: string) {
  return ["super_admin", "manager", "hr", "supervisor"].includes(role);
}

export function canAccessReports(role: string) {
  return ["super_admin", "manager", "hr"].includes(role);
}

export function canAccessSettings(role: string) {
  return ["super_admin", "hr"].includes(role);
}
