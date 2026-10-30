"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

type Step = {
  id: string;
  number: number;
  label: string;
  mobileLabel: string;
  path: string;
};

const STEPS: Step[] = [
     {
    id: "survey",
    number: 1,
    label: "Details",
    mobileLabel: "Survey",
    path: "/",
  },

    {
    id: "screener",
    number: 2,
    label: "Qualification",
    mobileLabel: "Screener",
    path: "/screener",
  },

  {
    id: "survey-setup",
    number: 3,
    label: "URL Setup",
    mobileLabel: "Survey",
    path: "/survey-setup",
  },

  {
    id: "sample-routing",
    number: 4,
    label: "Allocation",
    mobileLabel: "Routing",
    path: "/sample-routing",
  },
  {
    id: "review",
    number: 5,
    label: "Review & Launch",
    mobileLabel: "Review",
    path: "/review",
  },
];

export default function ProjectSetupStepper() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();

  const projectId = params?.id;

  if (!projectId) {
    return null;
  }

  const getStepUrl = (step: Step) => {
    return `/project/${projectId}${step.path}`;
  };

  const getCurrentStepIndex = () => {
    // Step 1
    if (pathname === `/project/${projectId}`) {
      return 0;
    }

    // Steps 2+
    const index = STEPS.findIndex((step, index) => {
      if (index === 0) return false;

      return pathname === getStepUrl(step) ||
        pathname.startsWith(`${getStepUrl(step)}/`);
    });

    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="mb-8 w-full">
      {/* =====================================================
          DESKTOP / MOBILE STEPPER
      ====================================================== */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[900px] px-2">
          <div className="relative">

            {/* Background progress line */}
            <div
              className="
                absolute
                left-[6.25%]
                right-[6.25%]
                top-5
                h-0.5
                bg-zinc-200
                dark:bg-zinc-800
              "
            />

            {/* Active progress line */}
            <div
              className="
                absolute
                left-[6.25%]
                top-5
                h-0.5
                bg-zinc-900
                transition-all
                duration-500
                dark:bg-white
              "
              style={{
                width:
                  currentStepIndex === 0
                    ? "0%"
                    : `${(currentStepIndex / (STEPS.length - 1)) * 87.5}%`,
              }}
            />

            {/* Steps */}
            <div className="relative flex justify-between">
              {STEPS.map((step, index) => {
                const isCurrent = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                const isFuture = index > currentStepIndex;

                const canNavigate = !isFuture;

                const circleClass = `
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  border-2
                  text-sm
                  font-semibold
                  transition-all
                  duration-200
                  ${
                    isCurrent
                      ? `
                        border-zinc-900
                        bg-zinc-800
                        text-white
                        shadow-md
                        ring-4
                        ring-zinc-900/10
                        dark:border-white
                        dark:bg-white
                        dark:text-zinc-900
                        dark:ring-white/10
                      `
                      : isCompleted
                      ? `
                        border-zinc-900
                        bg-green-700
                        text-white
                        dark:border-white
                        dark:bg-white
                        dark:text-zinc-900
                      `
                      : `
                        border-zinc-300
                        bg-zinc-900
                        text-zinc-400
                        dark:border-zinc-700
                        dark:bg-zinc-900
                        dark:text-zinc-500
                      `
                  }
                `;

                const content = (
                  <div className="flex min-w-[105px] flex-col items-center">
                    {/* Circle */}
                    <div className={circleClass}>
                      {isCompleted ? "✓" : step.number}
                    </div>

                    {/* Desktop label */}
                    <div
                      className={`
                        mt-2
                        max-w-[125px]
                        text-center
                        text-xs
                        font-medium
                        leading-tight
                        ${
                          isCurrent
                            ? "text-blue-700 dark:text-white"
                            : isCompleted
                            ? "text-gray-500 dark:text-zinc-300"
                            : "text-zinc-400 dark:text-zinc-500"
                        }
                      `}
                    >
                      <span className="hidden sm:inline">
                        {step.label}
                      </span>

                      <span className="sm:hidden">
                        {step.mobileLabel}
                      </span>
                    </div>
                  </div>
                );

                if (canNavigate) {
                  return (
                    <Link
                      key={step.id}
                      href={getStepUrl(step)}
                      aria-current={isCurrent ? "step" : undefined}
                      className="
                        rounded-lg
                        outline-none
                        transition
                        focus-visible:ring-2
                        focus-visible:ring-zinc-900
                        dark:focus-visible:ring-white
                      "
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    key={step.id}
                    aria-disabled="true"
                    className="cursor-not-allowed"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          CURRENT STEP INFO
      ====================================================== */}
      <div
        className="
          mt-5
          flex
          flex-col
          gap-1
          border-b
          border-zinc-200
          pb-4
          dark:border-zinc-800
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Project Setup
          </div>

          <div className="mt-1 text-lg font-semibold text-white">
            {STEPS[currentStepIndex]?.label}
          </div>
        </div>

        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Step{" "}
          <span className="font-semibold text-white">
            {currentStepIndex + 1}
          </span>{" "}
          of {STEPS.length}
        </div>
      </div>
    </div>
  );
}