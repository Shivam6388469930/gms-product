import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/Logoutbutton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/project" className="flex items-center gap-3">
              <Image src="/2.svg" alt="" width={32} height={32} className="h-8 w-32 rounded-lg object-cover" />
              <span className="text-[15px] font-semibold tracking-tight">GMS</span>
            </Link>
            <nav className="flex items-center gap-5">
              <Link href="/project" className="text-sm font-medium">Projects</Link>
              <Link href="/suppliers" className="text-sm font-medium">Suppliers</Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}