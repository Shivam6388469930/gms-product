"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ErrorAlert, Field, SubmitButton, linkClass } from "@/components/Ui";
import { postJSON } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { ok, data } = await postJSON("/api/auth/forgot-password", { email });
    setLoading(false);

    if (!ok) {
      setError(data.message || "Something went wrong. Try again.");
      return;
    }
    setDone(true);
  }

  const backLink = (
    <Link href="/auth/login" className={linkClass}>
      Back to log in
    </Link>
  );

  if (done) {
    return (
      <AuthShell
        title="Check your email"
        description={
          <>
            If an account exists for{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {email.trim().toLowerCase()}
            </span>
            , we sent a link to reset your password.
          </>
        }
        footer={backLink}
      />
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we'll send you a reset link."
      footer={backLink}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
        <ErrorAlert message={error} />
        <SubmitButton loading={loading} loadingText="Sending link">
          Send reset link
        </SubmitButton>
      </form>
    </AuthShell>
  );
}