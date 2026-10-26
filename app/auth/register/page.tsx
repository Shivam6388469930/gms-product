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
import { FolderKanban, Sparkles, Compass, Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "supplier" | "respondent">("client");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleOptions = [
    {
      id: "client" as const,
      title: "Client / Researcher",
      subtitle: "Launch & manage DIY sample research",
      portal: "Client Workspace",
      icon: FolderKanban,
      color: "border-indigo-500/50 bg-indigo-500/10 text-indigo-400",
    },
    {
      id: "supplier" as const,
      title: "Supplier Partner",
      subtitle: "Supply sample, manage panels & APIs",
      portal: "Supplier Portal",
      icon: Sparkles,
      color: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
    },
    {
      id: "respondent" as const,
      title: "Respondent Panelist",
      subtitle: "Answer surveys & earn cash rewards",
      portal: "Respondent App",
      icon: Compass,
      color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      const { ok, data } = await postJSON("/api/auth/register", {
        name: cleanName,
        email: cleanEmail,
        password,
        role,
      });

      if (!ok) {
        setError(
          data?.message || "Unable to create account. Please try again."
        );
        return;
      }

      // Registration successful
      router.push(
        `/auth/verify-email?email=${encodeURIComponent(cleanEmail)}&role=${role}`
      );
    } catch (err) {
      console.error("Registration error:", err);
      setError("Unable to connect to the server. Please try again.");
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
          <Link href="/auth/login" className={linkClass}>
            <span className="text-indigo-400 font-semibold hover:underline">Log in</span>
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Account Role Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Select Your Portal / Account Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = role === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setRole(opt.id)}
                  className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? `${opt.color} ring-1 ring-offset-0 ring-indigo-500 shadow-md`
                      : "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <Icon size={18} className={isSelected ? "" : "text-zinc-500"} />
                    {isSelected && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-white">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-white leading-tight">
                    {opt.title}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-tight">
                    {opt.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Field
          label="Name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Sarah Connor"
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

        <div className="text-[11px] text-zinc-400 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800">
          Creating a <span className="font-semibold text-white capitalize">{role}</span> account. You will have full access to the{" "}
          <span className="font-semibold text-indigo-400">
            {role === "supplier" ? "Supplier Hub" : role === "respondent" ? "Respondent Panel" : "Client Workspace"}
          </span>.
        </div>

        <ErrorAlert message={error} />

        <SubmitButton loading={loading} loadingText="Creating account...">
          Create {role === "supplier" ? "Supplier" : role === "respondent" ? "Respondent" : "Client"} Account
        </SubmitButton>
      </form>
    </AuthShell>
  );
}