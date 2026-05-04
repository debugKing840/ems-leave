export function Notice({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const error = typeof searchParams?.error === "string" ? searchParams.error : null;
  const success = typeof searchParams?.success === "string" ? searchParams.success : null;
  if (!error && !success) return null;
  return <div className={error ? "notice error" : "notice success"}>{error || success}</div>;
}
