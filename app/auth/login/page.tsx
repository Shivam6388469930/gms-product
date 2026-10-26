"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { ErrorAlert, Field, PasswordField, SubmitButton, linkClass } from "@/components/Ui";
import { postJSON } from "@/lib/auth-client";
import { Shield, Sparkles, Compass, FolderKanban } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ color: "#fff", padding: 40, textAlign: "center" }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getRedirectForRole(role?: string): string {
    if (returnUrl) return returnUrl;
    switch (role?.toLowerCase()) {
      case "admin":
      case "manager":
        return "/admin";
      case "supplier":
        return "/supplier/dashboard";
      case "respondent":
        return "/respondent/dashboard";
      case "client":
      case "user":
      default:
        return "/project";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { ok, data } = await postJSON("/api/auth/login", { email, password });

      if (!ok) {
        setError(data?.message || "Email or password is incorrect.");
        setLoading(false);
        return;
      }

      const user = data.user as { role?: string } | undefined;
      const destination = getRedirectForRole(user?.role);
      router.replace(destination);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  // Quick Portal Demo shortcuts for seamless evaluation
  const quickPortals = [
    {
      name: "Admin Console",
      role: "System Admin",
      href: "/admin",
      icon: Shield,
      color: "border-violet-500/30 hover:border-violet-500/60 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400",
    },
    {
      name: "Client App",
      role: "Researcher",
      href: "/project",
      icon: FolderKanban,
      color: "border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400",
    },
    {
      name: "Supplier Hub",
      role: "Sample Partner",
      href: "/supplier/dashboard",
      icon: Sparkles,
      color: "border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400",
    },
    {
      name: "Respondent App",
      role: "Panelist",
      href: "/respondent/dashboard",
      icon: Compass,
      color: "border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400",
    },
  ];

  return (
    <AuthShell
      title="Log in to GMS"
      footer={
        <>
          New to the platform?{" "}
          <Link href="/auth/register" className={linkClass}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <PasswordField
          autoComplete="current-password"
          placeholder="Your password"
          labelAside={
            <Link
              href="/auth/forgot-password"
              className="text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100 text-xs"
            >
              Forgot password?
            </Link>
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <ErrorAlert message={error} />
        <SubmitButton loading={loading} loadingText="Logging in...">
          Sign in
        </SubmitButton>
      </form>

      
     
    </AuthShell>
  );
}