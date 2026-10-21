
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/AuthShell";
import {
  ErrorAlert,
  Field,
  PasswordField,
  SubmitButton,
  linkClass,
} from "@/components/Ui";
import { postJSON } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const { ok, data } = await postJSON(
        "/api/auth/register",
        {
          name: cleanName,
          email: cleanEmail,
          password,
        }
      );

      if (!ok) {
        setError(
          data?.message ||
            "Unable to create account. Please try again."
        );
        return;
      }

      // Registration successful
      router.push(
        `/auth/verify-email?email=${encodeURIComponent(cleanEmail)}`
      );
    } catch (error) {
      console.error("Registration error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className={linkClass}
          >
            <span className="text-blue-500">
              Log in
            </span>
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        noValidate
      >
        <Field
          label="Name"
          type="text"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />

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
          showStrength
          autoComplete="new-password"
          minLength={8}
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <ErrorAlert message={error} />

        <SubmitButton
          loading={loading}
          loadingText="Creating account"
        >
          Create account
        </SubmitButton>
      </form>
    </AuthShell>
  );
}