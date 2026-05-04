import Link from "next/link";
import { signOut } from "@/app/actions";
import type { Profile } from "@/lib/types";
import { canAccessReports, canAccessSettings, canManageLeave } from "@/lib/auth";

export function Nav({ profile }: { profile: Profile }) {
  const links = [
    ["Dashboard", "/dashboard"],
    ["Apply Leave", "/leave/apply"],
    ["My Requests", "/leave/my-requests"],
    ["Calendar", "/leave/calendar"],
    ["Employees", "/employees"],
  ];

  if (canManageLeave(profile.role)) links.splice(3, 0, ["Approvals", "/leave/approvals"]);
  if (canAccessReports(profile.role)) links.push(["Reports", "/leave/reports"]);
  if (canAccessSettings(profile.role)) links.push(["Leave Types", "/settings/leave-types"]);

  return (
    <aside className="sidebar">
      <div>
        <h1>EMS Leave</h1>
        <p>{profile.full_name || profile.email}</p>
        <span>{profile.role.replaceAll("_", " ")}</span>
      </div>
      <nav>
        {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <form action={signOut}><button className="ghost" type="submit">Sign out</button></form>
    </aside>
  );
}
