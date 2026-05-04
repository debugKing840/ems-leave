export type AppRole = "super_admin" | "manager" | "hr" | "supervisor" | "staff";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: AppRole;
  department: string | null;
  manager_id: string | null;
  created_at: string;
};

export type LeaveStatus =
  | "pending_supervisor"
  | "pending_hr"
  | "approved"
  | "rejected"
  | "cancelled";

export type LeaveType = {
  id: string;
  name: string;
  annual_days_allowed: number;
  requires_document: boolean;
  created_at: string;
};

export type LeaveRequest = {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string | null;
  status: LeaveStatus;
  supervisor_comment: string | null;
  hr_comment: string | null;
  created_at: string;
};
