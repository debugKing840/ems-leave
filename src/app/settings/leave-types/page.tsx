import { Shell } from "@/components/Shell";
import { Notice } from "@/components/Notice";
import { createClient } from "@/lib/supabase/server";
import { createLeaveType } from "@/app/actions";

export default async function LeaveTypes({ searchParams }: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: leaveTypes } = await supabase.from("leave_types").select("*").order("name");
  return <Shell><div className="page-head"><div><h2>Leave Types</h2><p>Set annual allowance rules for each leave category.</p></div></div><Notice searchParams={params}/><section className="card" style={{marginBottom:16}}><h3>Add Leave Type</h3><form className="form" action={createLeaveType}><label>Name<input name="name" required placeholder="Annual Leave"/></label><label>Annual Days Allowed<input name="annual_days_allowed" type="number" min="0" required/></label><label><span><input style={{width:"auto"}} name="requires_document" type="checkbox"/> Requires supporting document</span></label><button type="submit">Add Type</button></form></section><table><thead><tr><th>Name</th><th>Annual Days</th><th>Document Required</th></tr></thead><tbody>{leaveTypes?.map((type) => <tr key={type.id}><td>{type.name}</td><td>{type.annual_days_allowed}</td><td>{type.requires_document ? "Yes" : "No"}</td></tr>)}</tbody></table></Shell>;
}
