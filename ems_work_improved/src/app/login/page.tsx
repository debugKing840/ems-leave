import { Notice } from "@/components/Notice";
import { signIn } from "@/app/actions";

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return (
    <div className="login">
      <div className="card">
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.5px", marginBottom: 4 }}>EMS Leave</div>
          <div style={{ color: "var(--muted)", fontSize: 14 }}>Sign in to manage your leave</div>
        </div>
        <Notice searchParams={params} />
        <form className="form" action={signIn}>
          <label>
            Email address
            <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
          </label>
          <label>
            Password
            <input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
          </label>
          <button type="submit" style={{ marginTop: 4, width: "100%", justifyContent: "center" }}>Sign in</button>
        </form>
      </div>
    </div>
  );
}
