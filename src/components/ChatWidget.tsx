"use client";

import { useState } from "react";
import { BotIcon, CornerDownLeftIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage
} from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import {
  ExpandableChat,
  ExpandableChatBody,
  ExpandableChatFooter,
  ExpandableChatHeader
} from "@/components/ui/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat-message-list";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatWidget({
  initialMessages = []
}: {
  initialMessages?: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.length
      ? initialMessages
      : [
          {
            role: "assistant",
            content: "Hello! How are you feeling today?"
          }
        ]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const message = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);

    try {
      const response = await fetch("/api/mental-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const payload = await response.json();
      const data = payload.data;
      if (data) {
        const assistantText = `${data.supportive_guidance}\n\nReflection: ${data.reflection_prompt}`;
        setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "I couldn't generate a response." }]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExpandableChat size="lg" position="bottom-right" icon={<BotIcon className="h-6 w-6" />}>
      <ExpandableChatHeader className="flex-col text-center justify-center">
        <h1 className="text-xl font-semibold">Mental health companion</h1>
        <p className="text-sm text-muted-foreground">Reflective, CBT-style chat support.</p>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <ChatMessageList>
          {messages.length === 0 ? (
            <ChatBubble variant="received">
              <ChatBubbleAvatar fallback="AI" />
              <ChatBubbleMessage>
                Share how you are feeling today to begin.
              </ChatBubbleMessage>
            </ChatBubble>
          ) : (
            messages.map((msg, index) => (
              <ChatBubble
                key={`${msg.role}-${index}`}
                variant={msg.role === "user" ? "sent" : "received"}
              >
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  src={
                    msg.role === "user"
                      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop"
                      : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                  }
                  fallback={msg.role === "user" ? "US" : "AI"}
                />
                <ChatBubbleMessage
                  variant={msg.role === "user" ? "sent" : "received"}
                >
                  {msg.content}
                </ChatBubbleMessage>
              </ChatBubble>
            ))
          )}

          {loading && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                fallback="AI"
              />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
      </ExpandableChatBody>

      <ExpandableChatFooter>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
        >
          <ChatInput
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="How are you feeling right now?"
            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center p-3 pt-0 justify-between">
            <span className="text-xs text-muted-foreground">
              Reflections are private and for your personal insight.
            </span>
            <Button type="submit" size="sm" className="ml-auto gap-1.5" disabled={loading}>
              Send Message
              <CornerDownLeftIcon className="size-3.5" />
            </Button>
          </div>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
}
