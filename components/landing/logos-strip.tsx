const AUDIENCES = [
  "Training Centers",
  "Universities",
  "Conference Organizers",
  "HR Teams",
  "Event Agencies",
  "Nonprofits",
] as const;

export function LogosStrip() {
  return (
    <section className="border-y border-border bg-secondary/40 py-10">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Built for teams that personalize at scale
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {AUDIENCES.map((audience) => (
            <span
              key={audience}
              className="text-sm font-semibold text-foreground"
            >
              {audience}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
