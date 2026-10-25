import { useEffect, useState } from "react";

const MESSAGES = [
  "Thinking…",
  "Planning…",
  "Building…",
  "Reviewing…",
  "Almost ready…",
];

export function MessageLoading() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-3 pb-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full border border-border/80 bg-card text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          V
        </span>
        <span className="text-xs font-medium text-muted-foreground">Vibe</span>
      </div>
      <p className="ml-8 text-sm text-muted-foreground">{MESSAGES[index]}</p>
    </div>
  );
}
