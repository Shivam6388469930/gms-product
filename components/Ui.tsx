"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 " +
  "placeholder:text-zinc-400 outline-none transition " +
  "focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 disabled:opacity-60 " +
  "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 " +
  "dark:focus:border-zinc-200 dark:focus:ring-zinc-50/10";

export const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export const linkClass =
  "font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 " +
  "dark:text-zinc-100 dark:hover:text-zinc-300";

export const primaryButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 " +
  "text-[15px] font-medium text-white outline-none transition hover:bg-zinc-800 " +
  "focus-visible:ring-4 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-70 " +
  "dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-50/30";

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`${className} animate-spin motion-reduce:animate-none`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={`${labelClass} mb-1.5`}>
        {label}
      </label>
      <input id={id} required {...props} className={inputClass} />
    </div>
  );
}

export function getStrength(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

export function PasswordField({
  label = "Password",
  labelAside,
  showStrength = false,
  value,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value"> & {
  value: string;
  label?: string;
  labelAside?: ReactNode;
  showStrength?: boolean;
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  const strength = getStrength(value);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {labelAside && <span className="text-sm">{labelAside}</span>}
      </div>

      <div className="relative">
        <input
          id={id}
          required
          {...props}
          type={show ? "text" : "password"}
          value={value}
          className={`${inputClass} pr-16`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 outline-none transition hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-200"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>

      {showStrength && (
        <div className="mt-2.5 flex items-center gap-3" aria-live="polite">
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                  strength >= i ? "bg-zinc-900 dark:bg-zinc-50" : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              />
            ))}
          </div>
          <span className="w-12 text-right text-xs text-zinc-500 dark:text-zinc-400">
            {strengthLabels[strength]}
          </span>
        </div>
      )}
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
    >
      {message}
    </p>
  );
}

export function SubmitButton({
  loading,
  children,
  loadingText,
}: {
  loading: boolean;
  children: ReactNode;
  loadingText: string;
}) {
  return (
    <button type="submit" disabled={loading} className={primaryButtonClass}>
      {loading && <Spinner />}
      {loading ? loadingText : children}
    </button>
  );
}