import { Shell } from "@/components/Shell";
import { Notice } from "@/components/Notice";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { createEmployee } from "@/app/actions";
import type { AppRole, Profile } from "@/lib/types";

const roleCreationMap: Record<AppRole, AppRole[]> = {
  super_admin: ["manager", "hr"],
  manager: ["supervisor", "staff"],
  hr: ["supervisor", "staff"],
  supervisor: ["staff"],
  staff: [],
};

export default async function Employees({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const current = await getCurrentProfile();
  const supabase = await createClient();
  const { data: employees } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  const allowedRoles = roleCreationMap[current.role] ?? [];
  const profiles = (employees ?? []) as Profile[];

  return (
    <Shell>
      <div className="page-head">
        <div>
          <h2>Employees</h2>
          <p>Create employees and manage the basic team structure.</p>
        </div>
      </div>
      <Notice searchParams={params} />

      {allowedRoles.length > 0 && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 680 }}>
          <h3 style={{ marginBottom: 20 }}>Add Employee</h3>
          <form className="form" action={createEmployee}>
            <label>Full Name <input name="full_name" required /></label>
            <label>Email <input name="email" type="email" required /></label>
            <label>Temporary Password <input name="password" type="password" minLength={6} required /></label>
            <label>
              Role
              <select name="role">
                {allowedRoles.map((role) => (
                  <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
            <label>Department <input name="department" placeholder="Finance, HR, Programmes…" /></label>
            <label>
              Reports To
              <select name="manager_id">
                <option value="">— None —</option>
                {profiles.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name || e.email}</option>
                ))}
              </select>
            </label>
            <div><button type="submit">Create Employee</button></div>
          </form>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((e) => (
              <tr key={e.id}>
                <td>{e.full_name || "—"}</td>
                <td>{e.email}</td>
                <td><span className="badge">{e.role?.replaceAll("_", " ")}</span></td>
                <td>{e.department || "—"}</td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: 32 }}>No employees yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
