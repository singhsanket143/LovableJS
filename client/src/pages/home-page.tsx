import { Navbar } from "@/components/navbar";
import { ProjectForm } from "@/components/project-form";
import { ProjectsList } from "@/components/projects-list";

const STEPS = [
  { title: "Describe", body: "Say what you want in plain language." },
  { title: "Generate", body: "The agent builds in a sandbox while you wait." },
  { title: "Preview", body: "Inspect the live UI and iterate in chat." },
] as const;

export function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col">
      <Navbar />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.92_0.02_265/0.35),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.35_0.04_265/0.4),transparent)]"
      />
      <div className="flex flex-1 flex-col px-4 pb-20 pt-28">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-16">
          <section className="flex flex-col items-center gap-6 text-center">
            <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-balance md:text-4xl md:leading-[1.15]">
              Build apps by chatting
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              Describe an idea. Vibe plans, codes, and ships a preview you can open and refine.
            </p>
            <div className="w-full pt-2">
              <ProjectForm />
            </div>
          </section>

          <section className="grid gap-6 border-y border-border/80 py-8 sm:grid-cols-3 sm:gap-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="space-y-1.5 text-center sm:text-left">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="text-sm font-medium">{step.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </section>

          <ProjectsList />
        </div>
      </div>
    </main>
  );
}
