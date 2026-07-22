import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = [
  { title: "Upload", subtitle: "Template & Records" },
  { title: "Design", subtitle: "Place Text Elements" },
  { title: "Generate", subtitle: "Review & Export" },
] as const;

export type GenerateWizardStepIndex = 0 | 1 | 2;

export interface GenerateStepWizardProps {
  currentStepIndex: GenerateWizardStepIndex;
  variant?: "default" | "compact";
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

function badgeClasses(status: StepVisualState, compact: boolean): string {
  return cn(
    "flex shrink-0 items-center justify-center rounded-full font-bold tabular-nums",
    compact
      ? "size-7 text-xs lg:size-8 lg:text-sm"
      : "size-(--wizard-badge-size) text-xl sm:text-5xl",
    status === "done" && "bg-success/15 text-success [&_svg]:text-success",
    status === "current" && "bg-foreground text-background",
    status === "next" && "bg-muted text-muted-foreground"
  );
}

function titleClasses(status: StepVisualState, compact: boolean): string {
  return cn(
    compact
      ? "hidden truncate text-sm font-bold leading-none lg:inline"
      : "wrap-break-word text-base font-bold leading-tight sm:text-lg md:text-xl lg:text-2xl",
    status === "done" && "text-success",
    status === "current" && "text-foreground",
    status === "next" && "text-muted-foreground"
  );
}

function GenerateStepWizardDefault({
  currentStepIndex,
  className,
}: GenerateStepWizardProps) {
  return (
    <nav
      aria-label="Design personalization steps"
      className={cn(
        "font-heading",
        "[--wizard-badge-size:2.75rem] sm:[--wizard-badge-size:4.5rem]",
        className
      )}
    >
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
                <span className={badgeClasses(status, false)}>
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
                <p className={titleClasses(status, false)} aria-current={status === "current" ? "step" : undefined}>
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

function GenerateStepWizardCompact({
  currentStepIndex,
  className,
}: GenerateStepWizardProps) {
  return (
    <nav
      aria-label="Design personalization steps"
      className={cn(
        "font-heading",
        className
      )}
    >
      <ol className="flex min-w-0 max-w-full items-center justify-center gap-1 lg:gap-2.5">
        {STEPS.map((step, i) => {
          const status = stepState(i, currentStepIndex);

          return (
            <Fragment key={step.title}>
              <li
                className="flex shrink-0 items-center gap-1 lg:min-w-0 lg:gap-2"
                aria-current={status === "current" ? "step" : undefined}
              >
                <span className={badgeClasses(status, true)}>
                  {status === "done" ? (
                    <Check className="size-3.5 stroke-[2.5] lg:size-4" aria-hidden />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </span>
                <span className={titleClasses(status, true)}>{step.title}</span>
              </li>

              {i < STEPS.length - 1 ? (
                <li
                  className="flex w-2 shrink-0 items-center lg:min-w-6 lg:max-w-12 lg:flex-1 lg:w-auto"
                  aria-hidden
                >
                  <div
                    className={cn(
                      "h-0.5 w-full rounded-full lg:h-1",
                      connectorClasses(stepState(i, currentStepIndex))
                    )}
                  />
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

export function GenerateStepWizard({
  currentStepIndex,
  variant = "default",
  className,
}: GenerateStepWizardProps) {
  if (variant === "compact") {
    return (
      <GenerateStepWizardCompact
        currentStepIndex={currentStepIndex}
        className={className}
      />
    );
  }

  return (
    <GenerateStepWizardDefault
      currentStepIndex={currentStepIndex}
      className={className}
    />
  );
}
