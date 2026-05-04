import Link from "next/link";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export default async function Dashboard() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const year = new Date().getFullYear();

  const [{ count: employeeCount }, { count: pendingCount }, { count: approvedCount }, { data: balances }] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("leave_requests").select("id", { count: "exact", head: true }).in("status", ["pending_supervisor", "pending_hr"]),
      supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("leave_balances").select("*, leave_types(name, annual_days_allowed)").eq("employee_id", profile.id).eq("year", year),
    ]);

  return (
    <Shell>
      <div className="page-head">
        <div>
          <h2>Welcome back, {profile.full_name?.split(" ")[0] || "there"} 👋</h2>
          <p>Here&apos;s what&apos;s happening across the organisation.</p>
        </div>
        <Link className="button" href="/leave/apply">Apply Leave</Link>
      </div>

      <section className="grid">
        <div className="card">
          <h3>Total Employees</h3>
          <div className="metric">{employeeCount ?? 0}</div>
        </div>
        <div className="card">
          <h3>Pending Requests</h3>
          <div className="metric">{pendingCount ?? 0}</div>
        </div>
        <div className="card">
          <h3>Approved Leaves</h3>
          <div className="metric">{approvedCount ?? 0}</div>
        </div>
      </section>

      {balances && balances.length > 0 && (
        <>
          <p className="section-title" style={{ marginBottom: 14 }}>My Leave Balances — {year}</p>
          <div className="balance-grid">
            {balances.map((b: any) => {
              const total = b.leave_types?.annual_days_allowed ?? b.total_days;
              const used = b.used_days ?? 0;
              const remaining = b.remaining_days ?? total - used;
              const pct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
              return (
                <div key={b.id} className="balance-card">
                  <div className="b-name">{b.leave_types?.name ?? "Leave"}</div>
                  <div className="b-remaining">{remaining}</div>
                  <div className="b-total">of {total} days remaining</div>
                  <div className="balance-bar">
                    <div className="balance-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Shell>
  );
}
