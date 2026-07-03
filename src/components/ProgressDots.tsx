export function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      aria-label={`Step ${step + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={
            i === step
              ? "h-1.5 w-6 rounded-full bg-foreground/60"
              : "h-1.5 w-1.5 rounded-full bg-foreground/20"
          }
        />
      ))}
    </div>
  );
}
