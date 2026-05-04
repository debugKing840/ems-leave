import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, canAccessReports } from "@/lib/auth";

export default async function Reports() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  if (!canAccessReports(profile.role)) return <Shell><div className="card">You do not have access to reports.</div></Shell>;

  const { data: approved } = await supabase
    .from("leave_requests")
    .select("number_of_days, leave_types(name), profiles(full_name,email,department)")
    .eq("status", "approved");

  const byEmployee = new Map<string, number>();
  approved?.forEach((raw) => {
    const row = raw as any;
    const name = row.profiles?.full_name || row.profiles?.email || "Unknown";
    byEmployee.set(name, (byEmployee.get(name) || 0) + Number(row.number_of_days || 0));
  });

  return <Shell><div className="page-head"><div><h2>Leave Reports</h2><p>Total approved leave days by employee.</p></div></div><table><thead><tr><th>Employee</th><th>Approved Days Taken</th></tr></thead><tbody>{Array.from(byEmployee.entries()).map(([name, days]) => <tr key={name}><td>{name}</td><td>{days}</td></tr>)}{byEmployee.size === 0 && <tr><td colSpan={2}>No approved leave data yet.</td></tr>}</tbody></table></Shell>;
}
