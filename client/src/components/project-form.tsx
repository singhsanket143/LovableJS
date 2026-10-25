import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { PROJECT_TEMPLATES } from "@/constants";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  value: z.string().min(1, { message: "Tell Vibe what to build" }).max(10_000),
});

export function ProjectForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isFocused, setIsFocused] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: "" },
  });

  const createProject = useMutation({
    mutationFn: (value: string) => api.createProject(value),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate(`/projects/${data.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const isPending = createProject.isPending;
  const isDisabled = isPending || !form.formState.isValid;

  return (
    <Form {...form}>
      <section className="space-y-6">
        <form
          onSubmit={form.handleSubmit((values) => createProject.mutateAsync(values.value))}
          className={cn(
            "relative rounded-xl border border-border/80 bg-card p-3 pt-0 shadow-sm transition-[border-color,box-shadow]",
            isFocused && "border-foreground/15 shadow-md ring-1 ring-foreground/5",
          )}
        >
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <TextareaAutosize
                {...field}
                placeholder="What would you like to build?"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                minRows={3}
                maxRows={8}
                className="w-full resize-none border-none bg-transparent px-1 pt-3 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/70"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    form.handleSubmit((values) => createProject.mutateAsync(values.value))(e);
                  }
                }}
                disabled={isPending}
              />
            )}
          />
          <div className="flex gap-x-2 items-end justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                ⌘ Enter
              </kbd>
            </p>
            <Button
              size="icon"
              className={cn("size-9 shrink-0 rounded-full", isDisabled && "opacity-40")}
              disabled={isDisabled}
              aria-label="Create project"
            >
              {isPending ? <Loader2Icon className="animate-spin" /> : <ArrowUpIcon />}
            </Button>
          </div>
        </form>
        <div className="flex flex-wrap justify-center gap-2">
          {PROJECT_TEMPLATES.map((template) => (
            <Button
              key={template.title}
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-border/70 bg-transparent text-xs font-normal text-muted-foreground hover:border-foreground/20 hover:bg-accent hover:text-foreground"
              onClick={() =>
                form.setValue("value", template.prompt, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
            >
              <span>{template.emoji}</span>
              {template.title}
            </Button>
          ))}
        </div>
      </section>
    </Form>
  );
}
