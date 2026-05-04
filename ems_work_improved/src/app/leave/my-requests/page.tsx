import { Shell } from "@/components/Shell";
import { Notice } from "@/components/Notice";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { prettyStatus } from "@/lib/leave";
import { cancelLeave } from "@/app/actions";

type RequestRow = {
  id: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  status: string;
  reason: string | null;
  supervisor_comment: string | null;
  hr_comment: string | null;
  leave_types: { name: string } | null;
};

export default async function MyRequests({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("leave_requests")
    .select("id, start_date, end_date, number_of_days, status, reason, supervisor_comment, hr_comment, leave_types(name)")
    .eq("employee_id", profile.id)
    .order("created_at", { ascending: false });

  const rows = (requests ?? []) as RequestRow[];

  function badgeClass(status: string) {
    if (status === "approved") return "badge approved";
    if (status === "rejected") return "badge rejected";
    if (status.startsWith("pending")) return "badge pending";
    return "badge";
  }

  return (
    <Shell>
      <div className="page-head">
        <div>
          <h2>My Leave Requests</h2>
          <p>Track your submitted leave requests and approval status.</p>
        </div>
      </div>
      <Notice searchParams={params} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Status</th>
              <th>Comments</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.leave_types?.name ?? "—"}</td>
                <td>{r.start_date} → {r.end_date}</td>
                <td>{r.number_of_days}</td>
                <td><span className={badgeClass(r.status)}>{prettyStatus(r.status)}</span></td>
                <td><small>{r.supervisor_comment || r.hr_comment || "—"}</small></td>
                <td>
                  {r.status.startsWith("pending") && (
                    <form action={cancelLeave}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <button className="danger" type="submit" style={{ padding: "6px 12px", fontSize: 13 }}>Cancel</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>No leave requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
