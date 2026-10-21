"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/AuthShell";
import {
  Spinner,
  linkClass,
  primaryButtonClass,
} from "@/components/Ui";
import { postJSON } from "@/lib/auth-client";

type State =
  | "checking"
  | "waiting"
  | "success"
  | "error";

function VerifyEmail() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  /*
   * token = email verification link
   * email = page shown immediately after registration
   */
  const [state, setState] = useState<State>(() => {
    if (token) return "checking";
    if (email) return "waiting";
    return "error";
  });

  const [message, setMessage] = useState(() => {
    if (!token && !email) {
      return "This verification link is invalid.";
    }

    return "";
  });

  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) {
      return;
    }

    started.current = true;

    async function verifyEmail() {
      try {
        const { ok, data } = await postJSON(
          "/api/auth/verify-email",
          {
            token,
          }
        );

        if (ok) {
          setState("success");
          return;
        }

        setMessage(
          data?.message ||
            "This link is invalid, expired, or already used."
        );

        setState("error");
      } catch (error) {
        console.error(
          "Email verification error:",
          error
        );

        setMessage(
          "Unable to verify your email right now. Please try again later."
        );

        setState("error");
      }
    }

    verifyEmail();
  }, [token]);

  // ----------------------------------------
  // After registration
  // ----------------------------------------
  if (state === "waiting") {
    return (
      <AuthShell
        title="Check your email"
        description={
          <>
            We sent a verification link to{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {email}
            </span>
            .
            <br />
            <br />
            Please check your inbox and click the
            verification link to activate your account.
          </>
        }
        footer={
          <Link
            href="/auth/login"
            className={linkClass}
          >
            Go to log in
          </Link>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            The verification link will expire after 30
            minutes.
          </p>

          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            If you don't see the email, check your
            spam or junk folder.
          </p>
        </div>
      </AuthShell>
    );
  }

  // ----------------------------------------
  // Verifying token
  // ----------------------------------------
  if (state === "checking") {
    return (
      <AuthShell
        title="Verifying your email"
        description="This only takes a moment."
      >
        <div className="flex justify-center">
          <Spinner className="h-5 w-5 text-zinc-500" />
        </div>
      </AuthShell>
    );
  }

  // ----------------------------------------
  // Successfully verified
  // ----------------------------------------
  if (state === "success") {
    return (
      <AuthShell
        title="Email verified"
        description="Your account is ready. Log in to continue."
      >
        <Link
          href="/auth/login"
          className={primaryButtonClass}
        >
          Log in
        </Link>
      </AuthShell>
    );
  }

  // ----------------------------------------
  // Error
  // ----------------------------------------
  return (
    <AuthShell
      title="Verification failed"
      description={message}
      footer={
        <Link
          href="/auth/login"
          className={linkClass}
        >
          Go to log in
        </Link>
      }
    />
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}