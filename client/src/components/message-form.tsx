import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  value: z.string().min(1).max(10_000),
});

export function MessageForm({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [isFocused, setIsFocused] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: "" },
  });

  const createMessage = useMutation({
    mutationFn: (value: string) => api.createMessage(projectId, value),
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["messages", projectId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const isPending = createMessage.isPending;
  const isDisabled = isPending || !form.formState.isValid;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => createMessage.mutateAsync(values.value))}
        className={cn(
          "relative rounded-xl border border-border/80 bg-card p-3 pt-0 shadow-sm transition-[border-color,box-shadow]",
          isFocused && "border-foreground/15 ring-1 ring-foreground/5",
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
              minRows={2}
              maxRows={8}
              className="w-full resize-none border-none bg-transparent px-1 pt-3 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/70"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  form.handleSubmit((values) => createMessage.mutateAsync(values.value))(e);
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
          >
            {isPending ? <Loader2Icon className="animate-spin" /> : <ArrowUpIcon />}
          </Button>
        </div>
      </form>
    </Form>
  );
}
