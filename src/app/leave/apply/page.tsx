import { Shell } from "@/components/Shell";
import { Notice } from "@/components/Notice";
import { createClient } from "@/lib/supabase/server";
import { applyForLeave } from "@/app/actions";

export default async function ApplyLeave({ searchParams }: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: leaveTypes } = await supabase.from("leave_types").select("*").order("name");
  return <Shell><div className="page-head"><div><h2>Apply for Leave</h2><p>Weekends are automatically excluded from the day count.</p></div></div><Notice searchParams={params}/><section className="card"><form className="form" action={applyForLeave}><label>Leave Type<select name="leave_type_id" required>{leaveTypes?.map((type) => <option key={type.id} value={type.id}>{type.name} ({type.annual_days_allowed} days)</option>)}</select></label><label>Start Date<input name="start_date" type="date" required /></label><label>End Date<input name="end_date" type="date" required /></label><label>Reason<textarea name="reason" placeholder="Briefly explain the reason" /></label><button type="submit">Submit Request</button></form></section></Shell>;
}
