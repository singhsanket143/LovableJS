import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { MessageCard } from "@/components/message-card";
import { MessageForm } from "@/components/message-form";
import { MessageLoading } from "@/components/message-loading";
import { api } from "@/lib/api";
import { parsePlanMessage } from "@/lib/plan";
import type { Fragment } from "@/types";

interface MessagesContainerProps {
  projectId: string;
  activeFragment: Fragment | null;
  setActiveFragment: (fragment: Fragment | null) => void;
}

export function MessagesContainer({
  activeFragment,
  projectId,
  setActiveFragment,
}: MessagesContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAssistantMessageIdRef = useRef<string | null>(null);
  const { data: messages, isError } = useQuery({
    queryKey: ["messages", projectId],
    queryFn: () => api.listMessages(projectId),
    refetchInterval: 1000,
    structuralSharing: false,
  });

  useEffect(() => {
    const lastAssistantMessage = messages
      ?.slice()
      .reverse()
      .find((message) => message.role === "ASSISTANT");
    if (
      lastAssistantMessage?.fragment &&
      lastAssistantMessage.id !== lastAssistantMessageIdRef.current
    ) {
      setActiveFragment(lastAssistantMessage.fragment);
      lastAssistantMessageIdRef.current = lastAssistantMessage.id;
    }
  }, [messages, setActiveFragment]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages?.length]);

  const lastUserIndex = messages?.findLastIndex((message) => message.role === "USER") ?? -1;
  const isWorking =
    lastUserIndex >= 0 &&
    !messages
      ?.slice(lastUserIndex + 1)
      .some(
        (message) =>
          message.role === "ASSISTANT" &&
          !parsePlanMessage(message.content) &&
          (message.fragment || message.type === "ERROR"),
      );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="pt-2 pr-1">
          {isError && (
            <p className="px-4 text-sm text-destructive">Could not load messages.</p>
          )}
          {messages?.map((message) => (
            <MessageCard
              key={`${message.id}-${message.updatedAt}`}
              content={message.content}
              role={message.role}
              fragment={message.fragment}
              createdAt={message.createdAt}
              isActiveFragment={activeFragment?.id === message.fragment?.id}
              onFragmentClick={setActiveFragment}
              type={message.type}
            />
          ))}
          {isWorking && <MessageLoading />}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="relative border-t border-border/60 bg-background/80 p-3 backdrop-blur-sm">
        <div className="pointer-events-none absolute -top-8 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-background" />
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
}
