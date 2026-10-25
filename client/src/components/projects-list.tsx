import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpRightIcon, InboxIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export function ProjectsList() {
  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
  });

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium tracking-tight">Recent projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">Continue a build or start fresh above.</p>
        </div>
        {projects && projects.length > 0 && (
          <span className="text-xs tabular-nums text-muted-foreground">{projects.length}</span>
        )}
      </div>
      <div className="divide-y divide-border/80 rounded-xl border border-border/80 bg-card">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="px-4 py-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          ))}
        {isError && (
          <p className="px-4 py-6 text-sm text-destructive">Could not load projects. Is the API running?</p>
        )}
        {projects?.length === 0 && (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <InboxIcon className="mb-3 size-5 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-sm font-medium">No projects yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Your first project appears here after you submit a prompt.
            </p>
          </div>
        )}
        {projects?.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="group flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-accent/50"
          >
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium">{project.name}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Updated {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
              </p>
            </div>
            <ArrowUpRightIcon
              className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground"
              strokeWidth={1.5}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
