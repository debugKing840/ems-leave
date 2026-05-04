import { Shell } from "@/components/Shell";
import { Notice } from "@/components/Notice";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { prettyStatus } from "@/lib/leave";
import { updateLeaveStatus } from "@/app/actions";

type ApprovalRow = {
  id: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  status: string;
  reason: string | null;
  leave_types: { name: string } | null;
  profiles: { full_name: string | null; email: string | null; department: string | null } | null;
};

export default async function Approvals({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const statuses = ["super_admin", "hr"].includes(profile.role)
    ? ["pending_hr", "pending_supervisor"]
    : ["pending_supervisor"];

  const { data: requests } = await supabase
    .from("leave_requests")
    .select("id, start_date, end_date, number_of_days, status, reason, leave_types(name), profiles(full_name, email, department)")
    .in("status", statuses)
    .order("created_at", { ascending: false });

  const rows = (requests ?? []) as any[];

  return (
    <Shell>
      <div className="page-head">
        <div>
          <h2>Leave Approvals</h2>
          <p>Review, approve, or reject employee leave requests.</p>
        </div>
      </div>
      <Notice searchParams={params} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.profiles?.full_name || r.profiles?.email || "—"}</strong>
                  <br />
                  <small>{r.profiles?.department || "No department"}</small>
                </td>
                <td>
                  {r.leave_types?.name}
                  <br />
                  <small>{r.reason || "No reason given"}</small>
                </td>
                <td>{r.start_date} → {r.end_date}</td>
                <td>{r.number_of_days}</td>
                <td><span className="badge pending">{prettyStatus(r.status)}</span></td>
                <td>
                  <form className="actions" action={updateLeaveStatus}>
                    <input type="hidden" name="request_id" value={r.id} />
                    <input name="comment" placeholder="Comment (optional)" style={{ width: 160, fontSize: 13 }} />
                    <button name="action" value="approve" style={{ padding: "7px 14px", fontSize: 13 }}>✓ Approve</button>
                    <button className="secondary" name="action" value="reject" style={{ padding: "7px 14px", fontSize: 13 }}>✕ Reject</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>🎉 No pending leave requests right now.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
