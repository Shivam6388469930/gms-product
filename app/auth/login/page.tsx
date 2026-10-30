"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/AuthShell";
import {
  ErrorAlert,
  Field,
  PasswordField,
  SubmitButton,
  linkClass,
} from "@/components/Ui";

import { postJSON } from "@/lib/auth-client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            color: "#fff",
            padding: 40,
            textAlign: "center",
          }}
        >
          Loading...
        </div>
      }
    >
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
    if (returnUrl) {
      return returnUrl;
    }

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

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    // Prevent double-click / duplicate login requests.
    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { ok, data } = await postJSON(
        "/api/auth/login",
        {
          email,
          password,
        }
      );

      if (!ok) {
        setError(
          data?.message ||
            "Email or password is incorrect."
        );

        setLoading(false);
        return;
      }

      const user = data.user as
        | {
            role?: string;
          }
        | undefined;

      const destination = getRedirectForRole(
        user?.role
      );

      // Navigate away after successful login.
      // Do not reset loading here because the page is leaving.
      router.replace(destination);
    } catch (error) {
      console.error("LOGIN_ERROR:", error);

      setError(
        "An unexpected error occurred. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Log in to GMS"
      footer={
        <>
          New to the platform?{" "}
          <Link
            href="/auth/register"
            className={linkClass}
          >
            Create an account
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
      >
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
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
          onChange={(e) =>
            setPassword(e.target.value)
          }
          disabled={loading}
        />

        <ErrorAlert message={error} />

        <SubmitButton
          loading={loading}
          loadingText="Logging in..."
        >
          Sign in
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
