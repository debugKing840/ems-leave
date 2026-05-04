import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";

export default async function LeaveCalendar() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: leaves } = await supabase
    .from("leave_requests")
    .select("*, leave_types(name), profiles(full_name,email,department)")
    .eq("status", "approved")
    .gte("end_date", today)
    .order("start_date");

  return <Shell><div className="page-head"><div><h2>Leave Calendar</h2><p>Approved current and upcoming leaves.</p></div></div><section className="calendar-list">{leaves?.map((raw) => { const leave = raw as any; return <div className="card calendar-item" key={leave.id}><div><strong>{leave.profiles?.full_name || leave.profiles?.email}</strong><p>{leave.leave_types?.name} • {leave.profiles?.department || "No department"}</p></div><div>{leave.start_date} → {leave.end_date}<br/><small>{leave.number_of_days} working days</small></div></div>})}{!leaves?.length && <div className="card">No approved upcoming leave.</div>}</section></Shell>;
}
