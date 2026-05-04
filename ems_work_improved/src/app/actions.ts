"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { countLeaveDays } from "@/lib/leave";
import type { AppRole, LeaveStatus } from "@/lib/types";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const roleCreationMap: Record<AppRole, AppRole[]> = {
  super_admin: ["manager", "hr"],
  manager: ["supervisor", "staff"],
  hr: ["supervisor", "staff"],
  supervisor: ["staff"],
  staff: [],
};

export async function createEmployee(formData: FormData) {
  const current = await getCurrentProfile();
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "staff") as AppRole;
  const department = String(formData.get("department") || "").trim();
  const managerId = String(formData.get("manager_id") || "") || null;

  if (!roleCreationMap[current.role]?.includes(role)) {
    redirect("/employees?error=You are not allowed to create that role");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (error || !data.user) redirect(`/employees?error=${encodeURIComponent(error?.message || "Could not create user")}`);

  await admin.from("profiles").update({
    full_name: fullName,
    email,
    role,
    department,
    manager_id: managerId,
  }).eq("id", data.user.id);

  revalidatePath("/employees");
  redirect("/employees?success=Employee created successfully");
}

export async function applyForLeave(formData: FormData) {
  const current = await getCurrentProfile();
  const supabase = await createClient();
  const leaveTypeId = String(formData.get("leave_type_id") || "");
  const startDate = String(formData.get("start_date") || "");
  const endDate = String(formData.get("end_date") || "");
  const reason = String(formData.get("reason") || "").trim();
  const numberOfDays = countLeaveDays(startDate, endDate);

  if (!leaveTypeId || numberOfDays <= 0) redirect("/leave/apply?error=Check your leave type and dates");

  const { error } = await supabase.from("leave_requests").insert({
    employee_id: current.id,
    leave_type_id: leaveTypeId,
    start_date: startDate,
    end_date: endDate,
    number_of_days: numberOfDays,
    reason,
    status: "pending_supervisor",
  });

  if (error) redirect(`/leave/apply?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/leave/my-requests");
  redirect("/leave/my-requests?success=Leave request submitted");
}

export async function updateLeaveStatus(formData: FormData) {
  const current = await getCurrentProfile();
  const supabase = await createClient();
  const requestId = String(formData.get("request_id") || "");
  const action = String(formData.get("action") || "");
  const comment = String(formData.get("comment") || "").trim();

  let updates: Record<string, string | LeaveStatus> = {};

  if (["super_admin", "hr"].includes(current.role)) {
    updates = {
      status: action === "approve" ? "approved" : "rejected",
      hr_comment: comment,
    };
  } else if (["manager", "supervisor"].includes(current.role)) {
    updates = {
      status: action === "approve" ? "pending_hr" : "rejected",
      supervisor_comment: comment,
    };
  } else {
    redirect("/leave/approvals?error=Not allowed");
  }

  const { error } = await supabase.from("leave_requests").update(updates).eq("id", requestId);
  if (error) redirect(`/leave/approvals?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/leave/approvals");
  revalidatePath("/leave/calendar");
  redirect("/leave/approvals?success=Leave request updated");
}

export async function createLeaveType(formData: FormData) {
  const current = await getCurrentProfile();
  if (!["super_admin", "hr"].includes(current.role)) redirect("/settings/leave-types?error=Not allowed");

  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const annualDaysAllowed = Number(formData.get("annual_days_allowed") || 0);
  const requiresDocument = formData.get("requires_document") === "on";

  const { error } = await supabase.from("leave_types").insert({
    name,
    annual_days_allowed: annualDaysAllowed,
    requires_document: requiresDocument,
  });

  if (error) redirect(`/settings/leave-types?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/settings/leave-types");
  redirect("/settings/leave-types?success=Leave type added");
}

export async function cancelLeave(formData: FormData) {
  const current = await getCurrentProfile();
  const supabase = await createClient();
  const requestId = String(formData.get("request_id") || "");

  // Only the owner can cancel, and only if still pending
  const { data: req } = await supabase
    .from("leave_requests")
    .select("employee_id, status")
    .eq("id", requestId)
    .single();

  if (!req || req.employee_id !== current.id) {
    redirect("/leave/my-requests?error=Not allowed");
  }

  if (!req.status.startsWith("pending")) {
    redirect("/leave/my-requests?error=Only pending requests can be cancelled");
  }

  const { error } = await supabase
    .from("leave_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);

  if (error) redirect(`/leave/my-requests?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/leave/my-requests");
  redirect("/leave/my-requests?success=Leave request cancelled");
}
