'use client'



import Image from "next/image";
import Link from "next/link";

const CONTACT_EMAIL = "hello@yourdomain.com"; // replace with your sales / integration email

const steps = [
  "Audience",
  "Feasibility",
  "Pricing",
  "Survey setup",
  "Sample routing",
  "Live fieldwork",
  "Quality",
  "Data & reports",
];

const modules = [
  ["Audience Engine", "Define consumer, B2B and healthcare targets."],
  ["Feasibility Engine", "Estimate supply, IR and timing before you commit."],
  ["Pricing Engine", "Transparent, configurable quotes with CPI and total cost."],
  ["Sample Engine", "Traffic routed across GMS and partner supply."],
  ["Quota Engine", "Demographic and custom quotas, under your control."],
  ["Quality Engine", "Detect duplicate, fraudulent and low-quality respondents."],
  ["Data Engine", "Clean, structured exports ready for analysis."],
  ["Insight Engine", "Charts, cross-tabs and AI-assisted summaries."],
];

const qualityChecks = [
  "Respondent validation and duplicate detection",
  "Speeding, attention and patterned-response checks",
  "Geo and device consistency, suspicious traffic checks",
  "An explainable quality score for every respondent",
];

const endpoints = [
  ["Feasibility", "Supply, IR and timing for any audience"],
  ["Quote", "CPI and total cost, programmatically"],
  ["Project creation", "Create projects from your own tools"],
  ["Launch / pause", "Control fieldwork remotely"],
  ["Live progress", "Starts, completes, quotas and spend"],
  ["Data export", "Pull clean data on demand"],
  ["Webhooks", "Project and respondent events, pushed to you"],
];

const codeSample = `POST /v1/feasibility

{
  "country": "US",
  "audience": "consumer",
  "n": 1000,
  "ir": 35,
  "loi": 10
}

→ {
  "available_sample": 48200,
  "expected_completes": 1000,
  "cpi_range": { "min": 2.1, "max": 2.8 },
  "field_time_days": 3,
  "confidence": "high",
  "assumptions": ["..."],
  "generated_at": "2026-10-14T09:30:00Z"
}`;

const sectionTitle =
  "text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50";
const muted = "text-zinc-500 dark:text-zinc-400";
const primaryBtn =
  "inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-3 text-[15px] font-medium text-white outline-none transition hover:bg-zinc-800 focus-visible:ring-4 focus-visible:ring-zinc-900/20 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-50/30";
const ghostBtn =
  "inline-flex items-center justify-center rounded-lg border border-zinc-200 px-5 py-3 text-[15px] font-medium text-zinc-900 outline-none transition hover:bg-zinc-100 focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-900";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className="mt-0.5 shrink-0 text-zinc-900 dark:text-zinc-50">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-zinc-50/85 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 outline-none">
            <Image src="/2.svg" alt="" width={36} height={36} priority
              className="h-9 w-32 rounded-lg object-cover" />
            <span className="text-[15px] font-semibold tracking-tight">Global Matrix Survey</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#platform" className={`${muted} transition hover:text-zinc-900 dark:hover:text-zinc-50`}>
              Platform
            </a>
            <Link href="/project" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition">
              Client App
            </Link>
            <Link href="/admin" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-semibold transition">
              Admin
            </Link>
            <Link href="/supplier/dashboard" className="text-violet-600 hover:text-violet-500 dark:text-violet-400 font-semibold transition">
              Supplier
            </Link>
            <Link href="/respondent/dashboard" className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 font-semibold transition">
              Respondent
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:hover:bg-zinc-900">
              Log in
            </Link>
            <Link href="/auth/register" className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div>
          <p className={`mb-5 text-sm font-medium ${muted}`}>GMS DIY Research Platform</p>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Run global research from one workspace.
          </h1>
          <p className={`mt-6 max-w-xl text-lg leading-relaxed ${muted}`}>
            Define your audience, get feasibility and price in minutes, launch sample and watch
            fieldwork live. Self-service for simple projects, with GMS project managers when you
            need them.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/auth/register" className={primaryBtn}>Create an account</Link>
            <a href="#integration" className={ghostBtn}>Integrate via API</a>
          </div>
        </div>

        {/* Illustrative dashboard */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live fieldwork
            </div>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              Illustrative data
            </span>
          </div>

          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className={muted}>Completes vs target</span>
            <span className="font-medium tabular-nums">412 / 600</span>
          </div>
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className="h-full w-[69%] rounded-full bg-zinc-900 dark:bg-zinc-50" />
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Stat label="Starts" value="1,284" />
            <Stat label="Completes" value="412" />
            <Stat label="Screenouts" value="631" />
            <Stat label="Quota full" value="187" />
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
            <span className={muted}>Pause · Resume · Stop</span>
            <span className="font-medium">CPI and spend tracked live</span>
          </div>
        </div>
      </section>

      {/* Platform Portals Showcase */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-1">
              Multi-Role Platform Architecture
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              Four Specialized Portals. One Integrated Network.
            </h2>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
            Instantly switch between administrator operations, client researcher tooling, partner supplier routing, and panelist survey rewards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Portal 1: Client DIY App */}
          <Link
            href="/dashboard"
            className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 font-bold">
                  ⚡
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Live
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                Client DIY Workspace
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Audience targeting, automated feasibility, dynamic CPI pricing, screener setup, and real-time fieldwork telemetry.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Launch Client App →
            </div>
          </Link>

          {/* Portal 2: Admin Console */}
          <Link
            href="/admin"
            className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 font-bold">
                  🛡️
                </div>
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                  Control
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-violet-500 transition-colors">
                Admin Command Center
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                User governance, multi-supplier performance scoring, RBAC matrix, audit compliance trails, and system config.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
              Open Admin Console →
            </div>
          </Link>

          {/* Portal 3: Supplier Hub */}
          <Link
            href="/supplier/dashboard"
            className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 font-bold">
                  🌐
                </div>
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                  Supply API
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                Supplier Partner Hub
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Incoming project invitations, real-time quota delivery, postback webhooks, fraud detection, and monthly revenue reconciliation.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              Access Supplier Hub →
            </div>
          </Link>

          {/* Portal 4: Respondent Portal */}
          <Link
            href="/respondent/dashboard"
            className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold">
                  🎁
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Panelist
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                Respondent Panelist App
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Profile-matched questionnaires, live survey taking, wallet balances, streak bonuses, and instant gift card / PayPal redemptions.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Enter Respondent App →
            </div>
          </Link>
        </div>
      </section>

      {/* Workflow */}
      <section id="platform" className="border-y border-zinc-200 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className={sectionTitle}>From brief to data, in one flow.</h2>
          <p className={`mt-4 max-w-2xl text-lg ${muted}`}>
            Create a project in minutes: pick the country, audience, sample size, length and
            expected IR. You get estimated feasibility, CPI, total cost and field time before you launch.
          </p>

          <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
                  {i + 1}
                </span>
                <span className="text-[15px] font-medium">{s}</span>
              </li>
            ))}
          </ol>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-800">
            {modules.map(([name, desc]) => (
              <div key={name} className="bg-white p-6 dark:bg-zinc-950">
                <h3 className="text-[15px] font-semibold">{name}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality */}
      <section id="quality" className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <h2 className={sectionTitle}>Quality you can explain.</h2>
          <p className={`mt-4 text-lg leading-relaxed ${muted}`}>
            Every respondent gets a transparent quality score, so you know why a complete was kept
            or rejected. Our approach is designed to align with ESOMAR and GRBN online sample-quality principles.
          </p>
        </div>
        <ul className="space-y-4 self-center">
          {qualityChecks.map((c) => (
            <li key={c} className="flex gap-3 text-[15px] leading-relaxed">
              <Check />
              {c}
            </li>
          ))}
        </ul>
      </section>

      {/* Integration */}
      <section id="integration" className="border-y border-zinc-200 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-900/40 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2">
          <div>
            <p className={`mb-3 text-sm font-medium ${muted}`}>For platforms and research teams</p>
            <h2 className={sectionTitle}>Plug GMS into your own stack.</h2>
            <p className={`mt-4 text-lg leading-relaxed ${muted}`}>
              Connect your tools to GMS supply and quality through a simple API, then follow
              projects in real time with webhooks.
            </p>

            <ul className="mt-8 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {endpoints.map(([name, desc]) => (
                <li key={name} className="flex items-baseline justify-between gap-6 py-3.5">
                  <span className="text-[15px] font-medium">{name}</span>
                  <span className={`text-right text-sm ${muted}`}>{desc}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`mailto:${CONTACT_EMAIL}?subject=API%20integration%20enquiry`} className={primaryBtn}>
                Request API access
              </a>
              <Link href="/auth/register" className={ghostBtn}>Start in the dashboard</Link>
            </div>
          </div>

          <div className="self-start overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3 text-xs text-zinc-400">
              <span>Feasibility API</span>
              <span>Example</span>
            </div>
            <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed text-zinc-200">
              <code>{codeSample}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="rounded-3xl bg-zinc-900 px-8 py-14 text-center dark:bg-zinc-900 sm:px-16">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ready to run your next study?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
            Launch a simple project yourself, or talk to us about a larger programme or an integration.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/auth/register" className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-[15px] font-medium text-zinc-900 transition hover:bg-zinc-200">
              Create an account
            </Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-5 py-3 text-[15px] font-medium text-white transition hover:bg-zinc-800">
              Talk to our team
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm sm:flex-row">
          <span className={muted}>© 2026 Global Matrix Survey</span>
          <div className="flex gap-6">
            <Link href="/auth/login" className={`${muted} hover:text-zinc-900 dark:hover:text-zinc-50`}>Log in</Link>
            <Link href="/auth/register" className={`${muted} hover:text-zinc-900 dark:hover:text-zinc-50`}>Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}