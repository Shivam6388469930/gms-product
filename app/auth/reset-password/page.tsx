"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { ErrorAlert, PasswordField, SubmitButton, linkClass, primaryButtonClass } from "@/components/Ui";
import { postJSON } from "@/lib/auth-client";

function ResetPassword() {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { ok, data } = await postJSON("/api/auth/reset-password", { token, password });
    setLoading(false);

    if (!ok) {
      setError(data.message || "This link is invalid or has expired.");
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <AuthShell
        title="Link not valid"
        description="This reset link is missing its token. Request a new one."
        footer={
          <Link href="/forgot-password" className={linkClass}>
            Request a new link
          </Link>
        }
      />
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated" description="You can now log in with your new password.">
        <Link href="/auth/login" className={primaryButtonClass}>
          Log in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" description="Use at least 8 characters.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <PasswordField label="New password" showStrength autoComplete="new-password" minLength={8}
          value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
        <PasswordField label="Confirm password" autoComplete="new-password" minLength={8}
          value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={loading} />
        <ErrorAlert message={error} />
        <SubmitButton loading={loading} loadingText="Updating password">
          Update password
        </SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  );
}