import { ExternalLinkIcon, RefreshCcwIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import type { Fragment } from "@/types";

export function FragmentWeb({ data }: { data: Fragment }) {
  const [fragmentKey, setFragmentKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = window.location.origin + data.sandboxUrl;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        toast.success("Link copied");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Could not copy the preview link."));
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center gap-1.5 border-b border-border/80 bg-muted/20 px-2 py-1.5">
        <Hint text="Click to refresh" side="bottom" align="start">
          <Button size="sm" variant="ghost" className="h-8" onClick={() => setFragmentKey((prev) => prev + 1)}>
            <RefreshCcwIcon />
          </Button>
        </Hint>
        <Hint text="Click to copy" side="bottom">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 flex-1 justify-start text-start font-normal text-muted-foreground"
            disabled={!data.sandboxUrl || copied}
            onClick={handleCopy}
          >
            <span className="truncate">{data.sandboxUrl}</span>
          </Button>
        </Hint>
        <Hint text="Open in a new tab" side="bottom" align="start">
          <Button
            size="sm"
            disabled={!data.sandboxUrl}
            variant="ghost"
            className="h-8"
            onClick={() => window.open(data.sandboxUrl, "_blank")}
          >
            <ExternalLinkIcon />
          </Button>
        </Hint>
      </div>
      <iframe
        key={fragmentKey}
        className="h-full w-full bg-white"
        sandbox="allow-forms allow-scripts allow-same-origin"
        loading="lazy"
        title={data.title}
        src={data.sandboxUrl}
      />
    </div>
  );
}
