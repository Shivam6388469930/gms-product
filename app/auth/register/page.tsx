"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/AuthShell";
import { ErrorAlert, SubmitButton, linkClass } from "@/components/Ui";
import { postJSON } from "@/lib/auth-client";
import {
  FolderKanban,
  Compass,
  Check,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"client" | "respondent">("client");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleOptions = [
    {
      id: "client" as const,
      title: "Client / Researcher",
      subtitle: "Launch & manage DIY research projects",
      tag: "Create Surveys",
      icon: FolderKanban,
      activeColor: "border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-2 ring-indigo-500/30",
      accentBg: "bg-indigo-500 text-white",
    },
    {
      id: "respondent" as const,
      title: "Respondent Panelist",
      subtitle: "Take surveys & earn instant rewards",
      tag: "Earn Cash",
      icon: Compass,
      activeColor: "border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/30",
      accentBg: "bg-emerald-500 text-white",
    },
  ];

  function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
    if (!pwd) return { score: 0, label: "Empty", color: "bg-zinc-700" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500" };
    return { score: 4, label: "Strong", color: "bg-emerald-500" };
  }

  const strength = getPasswordStrength(password);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
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
          data?.message || "Unable to create account. Please check your details and try again."
        );
        return;
      }

      // Registration successful
      router.push(
        `/auth/verify-email?email=${encodeURIComponent(cleanEmail)}&role=${role}`
      );
    } catch (err) {
      console.error("Registration error:", err);
      setError("Unable to connect to the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      description="Choose your account type and get started in seconds."
      maxWidth="max-w-[480px]"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className={linkClass}>
            <span className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              Log in
            </span>
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
        {/* Role Selection */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              I want to register as
            </label>
            <span className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400">
              {role === "client" ? "Client Workspace" : "Respondent Panel"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = role === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setRole(opt.id)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-150 ${
                    isSelected
                      ? `${opt.activeColor} shadow-sm`
                      : "border-zinc-200 bg-zinc-50/70 hover:border-zinc-300 hover:bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80 dark:text-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        isSelected
                          ? opt.accentBg
                          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    {isSelected ? (
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${opt.accentBg}`}>
                        <Check size={10} strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {opt.tag}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                      {opt.title}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-tight">
                      {opt.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <UserIcon size={16} />
            </div>
            <input
              type="text"
              autoComplete="name"
              required
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/10"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Work or Personal Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <Mail size={16} />
            </div>
            <input
              type="email"
              autoComplete="email"
              required
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/10"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            {password.length > 0 && (
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Strength: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{strength.label}</span>
              </span>
            )}
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <Lock size={16} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-10 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Strength Bar */}
          {password.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1 rounded-full transition-all duration-200 ${
                    step <= strength.score ? strength.color : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Informational callout */}
        <div className="flex items-start gap-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-xs text-zinc-600 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400">
          <Sparkles size={15} className="mt-0.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
          <span>
            {role === "client" ? (
              <>
                You are creating a <strong className="text-zinc-900 dark:text-zinc-200">Client / Researcher</strong> account to create, launch, and monitor live research studies.
              </>
            ) : (
              <>
                You are registering as a <strong className="text-zinc-900 dark:text-zinc-200">Respondent Panelist</strong> under the Internal Platform Panel. You can answer surveys and withdraw real rewards.
              </>
            )}
          </span>
        </div>

        {/* Error Alert */}
        <ErrorAlert message={error} />

        {/* Submit */}
        <SubmitButton loading={loading} loadingText="Creating your account...">
          Create {role === "client" ? "Client" : "Respondent"} Account
        </SubmitButton>

        {/* Terms note */}
        <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
          By registering, you agree to our Terms of Service & Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
