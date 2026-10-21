"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { ErrorAlert, Field, PasswordField, SubmitButton, linkClass } from "@/components/Ui";
import { postJSON } from "@/lib/auth-client";

const REDIRECT_AFTER_LOGIN = "/project"; // change to your app's home

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { ok, data } = await postJSON("/api/auth/login", { email, password });

    if (!ok) {
      setError(data.message || "Email or password is incorrect.");
      setLoading(false);
      return;
    }

    router.replace(REDIRECT_AFTER_LOGIN);
    router.refresh();
  }

  return (
    <AuthShell
      title="Log in"
      footer={
        <>
          New here?{" "}
          <Link href="/auth/register" className={linkClass}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
        <PasswordField autoComplete="current-password" placeholder="Your password"
          labelAside={
            <Link href="/auth/forgot-password" className="text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100">
              Forgot password?
            </Link>
          }
          value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
        <ErrorAlert message={error} />
        <SubmitButton loading={loading} loadingText="Logging in">
          Log in
        </SubmitButton>
      </form>
    </AuthShell>
  );
}