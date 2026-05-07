import { Fragment } from "react";
import { Archivo } from "next/font/google";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const archivoWizard = Archivo({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-generate-wizard",
});

const STEPS = [
  { title: "Upload", subtitle: "Template & Attendees" },
  { title: "Design", subtitle: "Place Text Elements" },
  { title: "Generate", subtitle: "Review & Export" },
] as const;

export type GenerateWizardStepIndex = 0 | 1 | 2;

export interface GenerateStepWizardProps {
  currentStepIndex: GenerateWizardStepIndex;
  className?: string;
}

type StepVisualState = "done" | "current" | "next";

function stepState(
  index: number,
  currentStepIndex: GenerateWizardStepIndex
): StepVisualState {
  if (index < currentStepIndex) return "done";
  if (index === currentStepIndex) return "current";
  return "next";
}

function connectorClasses(state: StepVisualState): string {
  switch (state) {
    case "done":
      return "bg-success";
    case "current":
      return "bg-border";
    case "next":
      return "bg-muted";
    default:
      return "";
  }
}

export function GenerateStepWizard({
  currentStepIndex,
  className,
}: GenerateStepWizardProps) {
  return (
    <nav
      aria-label="Certificate generation steps"
      className={cn(
        archivoWizard.variable,
        "[font-family:var(--font-generate-wizard),system-ui,sans-serif]",
        "[--wizard-badge-size:2.75rem] sm:[--wizard-badge-size:4.5rem]",
        className
      )}
    >
      {/* Two-row grid: row 1 = circles + segments only between pairs; row 2 = labels under circles */}
      <div
        className="grid w-full min-w-0 gap-x-3 sm:gap-x-4"
        style={{
          gridTemplateColumns: "auto minmax(0, 1fr) auto minmax(0, 1fr) auto",
        }}
      >
        {STEPS.map((step, i) => {
          const status = stepState(i, currentStepIndex);
          const badgeCol = 2 * i + 1;

          return (
            <Fragment key={step.title}>
              <div
                className="flex items-center justify-center self-center"
                style={{ gridColumn: badgeCol, gridRow: 1, height: "var(--wizard-badge-size)" }}
              >
                <span
                  className={cn(
                    "flex size-(--wizard-badge-size) shrink-0 items-center justify-center rounded-full text-xl font-black tabular-nums sm:text-5xl",
                    status === "done" &&
                      "bg-success/15 text-success [&_svg]:text-success",
                    status === "current" && "bg-foreground text-background",
                    status === "next" && "bg-muted text-muted-foreground"
                  )}
                >
                  {status === "done" ? (
                    <Check className="size-5 stroke-[2.5] sm:size-6" aria-hidden />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </span>
              </div>

              <div
                className="mx-auto mt-3 max-w-44 min-w-0 px-1 text-center sm:mt-4 sm:max-w-none"
                style={{ gridColumn: badgeCol, gridRow: 2 }}
              >
                <p
                  className={cn(
                    "wrap-break-word text-base font-bold leading-tight sm:text-lg md:text-xl lg:text-2xl",
                    status === "done" && "text-success",
                    status === "current" && "text-foreground",
                    status === "next" && "text-muted-foreground"
                  )}
                  aria-current={status === "current" ? "step" : undefined}
                >
                  {step.title}
                </p>
                <p
                  className={cn(
                    "mt-0.5 wrap-break-word text-xs font-normal leading-snug sm:text-sm md:text-base",
                    status === "done" && "text-success",
                    status === "current" && "text-foreground",
                    status === "next" && "text-muted-foreground"
                  )}
                >
                  {step.subtitle}
                </p>
              </div>

              {i < STEPS.length - 1 ? (
                <div
                  className="flex min-h-0 min-w-0 items-center self-center"
                  style={{ gridColumn: badgeCol + 1, gridRow: 1 }}
                  role="presentation"
                >
                  <div
                    className={cn(
                      "h-1 min-h-1 w-full rounded-full sm:h-1.5",
                      connectorClasses(stepState(i, currentStepIndex))
                    )}
                  />
                </div>
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}
