import { CodeIcon, EyeIcon } from "lucide-react";
import { useState } from "react";
import { FileExplorer } from "@/components/file-explorer";
import { FragmentWeb } from "@/components/fragment-web";
import { MessagesContainer } from "@/components/messages-container";
import { ProjectHeader } from "@/components/project-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { FileCollection, Fragment } from "@/types";

export function ProjectView({ projectId }: { projectId: string }) {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview" | "code">("preview");

  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup direction="horizontal" className="hidden h-full md:flex">
        <ResizablePanel defaultSize={38} minSize={24} className="flex min-h-0 flex-col border-r border-border/80">
          <ProjectHeader projectId={projectId} />
          <MessagesContainer
            projectId={projectId}
            activeFragment={activeFragment}
            setActiveFragment={setActiveFragment}
          />
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border/80 transition-colors hover:bg-foreground/20" />
        <ResizablePanel defaultSize={65} minSize={40}>
          <PreviewTabs
            tabState={tabState}
            setTabState={setTabState}
            activeFragment={activeFragment}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      <div className="md:hidden h-full flex flex-col">
        <ProjectHeader projectId={projectId} />
        <Tabs defaultValue="chat" className="flex-1 min-h-0">
          <TabsList className="m-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="demo">Demo</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 min-h-0">
            <MessagesContainer
              projectId={projectId}
              activeFragment={activeFragment}
              setActiveFragment={setActiveFragment}
            />
          </TabsContent>
          <TabsContent value="demo" className="flex-1 min-h-0 h-[70vh]">
            {activeFragment ? (
              <FragmentWeb data={activeFragment} />
            ) : (
              <EmptyPreview />
            )}
          </TabsContent>
          <TabsContent value="code" className="flex-1 min-h-0 h-[70vh]">
            {activeFragment?.files ? (
              <FileExplorer files={activeFragment.files as FileCollection} />
            ) : (
              <EmptyPreview />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PreviewTabs({
  tabState,
  setTabState,
  activeFragment,
}: {
  tabState: "preview" | "code";
  setTabState: (value: "preview" | "code") => void;
  activeFragment: Fragment | null;
}) {
  return (
    <Tabs
      className="h-full gap-y-0"
      value={tabState}
      onValueChange={(value) => setTabState(value as "preview" | "code")}
    >
      <div className="flex w-full items-center border-b border-border/80 px-3 py-2">
        <TabsList className="h-8 bg-muted/50 p-0.5">
          <TabsTrigger value="preview" className="gap-1.5 px-3 text-xs">
            <EyeIcon className="size-3.5" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-1.5 px-3 text-xs">
            <CodeIcon className="size-3.5" />
            Code
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="preview" className="h-[calc(100%-52px)]">
        {activeFragment ? <FragmentWeb data={activeFragment} /> : <EmptyPreview />}
      </TabsContent>
      <TabsContent value="code" className="min-h-0 h-[calc(100%-52px)]">
        {activeFragment?.files ? (
          <FileExplorer files={activeFragment.files as FileCollection} />
        ) : (
          <EmptyPreview />
        )}
      </TabsContent>
    </Tabs>
  );
}

function EmptyPreview() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-sm font-medium text-foreground/80">Nothing to preview yet</p>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
        When the agent finishes, your live app and source files show up here.
      </p>
    </div>
  );
}
