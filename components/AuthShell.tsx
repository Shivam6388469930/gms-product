import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
};

// Put your logo at /public/2.svg
export function AuthShell({ title, description, footer, children }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-[360px]  px-4 py-4 shadow-gray-500 shadow-md">
        <Link
          href="/"
          aria-label="Home"
          className="mb-2 inline-block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-200"
        >
          <Image
            src="/2.svg"
            alt=""
            width={44}
            height={44}
            priority
            className="h-11 w-32 rounded-xl object-cover"
          />
        </Link>

        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </header>

        {children}

        {footer && (
          <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">{footer}</p>
        )}
      </div>
    </main>
  );
}