import { ReactNode } from "react";
import { getCurrentProfile } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export async function Shell({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();
  return <div className="app-shell"><Nav profile={profile} /><main>{children}</main></div>;
}
