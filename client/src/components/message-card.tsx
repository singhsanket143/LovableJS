import { format } from "date-fns";
import { CheckCircle2Icon, ChevronRightIcon, CircleIcon, LoaderCircleIcon } from "lucide-react";
import { parsePlanActivity, parsePlanMessage, type TodoItem } from "@/lib/plan";
import { cn } from "@/lib/utils";
import type { Fragment } from "@/types";

interface MessageCardProps {
  content: string;
  role: "USER" | "ASSISTANT";
  fragment: Fragment | null;
  createdAt: string;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: "RESULT" | "ERROR";
}

export function MessageCard({
  content,
  createdAt,
  fragment,
  isActiveFragment,
  onFragmentClick,
  role,
  type,
}: MessageCardProps) {
  const plan = role === "ASSISTANT" ? parsePlanMessage(content) : null;
  const activity = role === "ASSISTANT" ? parsePlanActivity(content) : null;

  if (role === "ASSISTANT") {
    return (
      <div
        className={cn(
          "group px-3 pb-5",
          type === "ERROR" && "text-destructive",
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full border border-border/80 bg-card text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            V
          </span>
          <span className="text-xs font-medium text-muted-foreground">Vibe</span>
          <span className="text-xs text-muted-foreground/0 transition-opacity group-hover:text-muted-foreground/80">
            {format(createdAt, "HH:mm · MMM d")}
          </span>
        </div>
        <div className="ml-8 flex flex-col gap-3">
          {plan ? (
            <PlanList todos={plan} activity={activity} />
          ) : (
            <p className="text-sm leading-relaxed text-foreground/90">{content}</p>
          )}
          {fragment && type === "RESULT" && (
            <button
              type="button"
              className={cn(
                "flex w-full max-w-sm items-center gap-3 rounded-lg border border-border/80 bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent/60",
                isActiveFragment && "border-foreground/20 bg-accent",
              )}
              onClick={() => onFragmentClick(fragment)}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{fragment.title}</p>
                <p className="text-xs text-muted-foreground">Open preview</p>
              </div>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end px-3 pb-5 pl-12">
      <div className="max-w-[85%] rounded-2xl rounded-br-md border border-border/60 bg-card px-3.5 py-2.5 text-sm leading-relaxed shadow-sm">
        {content}
      </div>
    </div>
  );
}

function PlanList({
  todos,
  activity,
}: {
  todos: TodoItem[];
  activity: { agent: string; detail: string } | null;
}) {
  return (
    <div className="w-full max-w-md space-y-2.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plan</p>
      {activity && (
        <p className="text-xs text-muted-foreground">
          {activity.agent} · {activity.detail}
        </p>
      )}
      <ul className="space-y-2">
        {todos.map((todo, index) => (
          <li key={`${index}-${todo.status}-${todo.content}`} className="flex items-start gap-2.5 text-sm">
            <PlanStatusIcon status={todo.status} />
            <span
              className={cn(
                "leading-snug",
                todo.status === "completed" && "text-muted-foreground line-through decoration-border",
                todo.status === "in_progress" && "font-medium",
              )}
            >
              {todo.content}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanStatusIcon({ status }: { status: TodoItem["status"] }) {
  if (status === "completed") {
    return <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-foreground/50" strokeWidth={1.5} />;
  }
  if (status === "in_progress") {
    return <LoaderCircleIcon className="mt-0.5 size-3.5 shrink-0 animate-spin text-foreground" strokeWidth={1.5} />;
  }
  return <CircleIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" strokeWidth={1.5} />;
}
