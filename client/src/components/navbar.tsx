import { GithubIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";

export function Navbar() {
  const scrolled = useScroll();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-200",
        scrolled ? "border-b border-border/80 bg-background/90 backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 text-foreground/90 hover:text-foreground">
          <img src="/logo.svg" alt="" width={22} height={22} className="opacity-90" />
          <span className="text-sm font-semibold tracking-tight">Vibe</span>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label={mounted && isDark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {mounted && isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" asChild>
            <a href="https://github.com/BernieTv/Lovable-Clone" target="_blank" rel="noreferrer">
              <GithubIcon className="size-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </Button>
        </div>
      </div>
    </nav>
  );
}
