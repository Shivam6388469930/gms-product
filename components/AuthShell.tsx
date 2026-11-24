import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

type Props = {
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  maxWidth?: string;
};

// Put your logo at /public/2.svg
export function AuthShell({
  title,
  description,
  footer,
  children,
  maxWidth = "max-w-[460px]",
}: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 transition-colors duration-200 dark:bg-zinc-950 sm:px-6">
      <div
        className={`w-full ${maxWidth} rounded-2xl border border-zinc-200/80 bg-white/95 p-6 shadow-xl shadow-zinc-200/50 backdrop-blur-md transition-colors duration-200 dark:border-zinc-800/80 dark:bg-zinc-900/90 dark:shadow-black/50 sm:p-8`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            aria-label="Home"
            className="inline-block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Image
              src="/2.svg"
              alt="GMS Research"
              width={140}
              height={44}
              priority
              className="h-10 w-auto rounded-lg object-contain"
            />
          </Link>
          <ThemeToggle />
        </div>

        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </header>

        {children}

        {footer && (
          <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {footer}
          </p>
        )}
      </div>
    </main>
  );
}