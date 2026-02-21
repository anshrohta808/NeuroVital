"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageNav from "@/components/PageNav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MedFactChatResponse } from "@/lib/types";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const formatResponse = (payload: MedFactChatResponse) => {
  const points = payload.key_points?.length
    ? `\n\nKey points:\n${payload.key_points.map((item) => `• ${item}`).join("\n")}`
    : "";
  return `${payload.response}${points}\n\n${payload.disclaimer}`;
};

export default function MedFactPage() {
  const router = useRouter();
  const supabase = useMemo(
    () => (typeof window === "undefined" ? null : createSupabaseBrowserClient()),
    []
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
      }
    };
    checkUser();
  }, [router, supabase]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const message = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/medfact-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const payload = await response.json();
      if (response.ok) {
        const content = formatResponse(payload.data as MedFactChatResponse);
        setMessages((prev) => [...prev, { role: "assistant", content }]);
      } else {
        setError(payload.error ?? "Unable to generate a response.");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I couldn't generate a response." }
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="card">
          <p className="section-title">MedFact</p>
          <h1 className="mt-2 text-3xl font-semibold">MedFact Authority</h1>
          <p className="mt-2 text-sm text-slate/70">
            Evidence-minded myth checking with clear, accessible explanations.
          </p>
          <div className="mt-4">
            <PageNav />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-title">MedFact Authority</p>
                <h2 className="mt-2 text-xl font-semibold">Hello! How can I help you today?</h2>
              </div>
              <span className="badge bg-aqua/10 text-aqua">AI verified</span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate/10 bg-white/80 p-4 text-sm text-slate/70">
              <p className="font-semibold text-slate">Sample questions:</p>
              <ul className="mt-2 space-y-1">
                <li>Is it true that vaccines weaken the immune system?</li>
                <li>Can cold weather cause a cold?</li>
                <li>Do detox teas remove toxins from the body?</li>
              </ul>
            </div>

            <div className="mt-5 max-h-[320px] space-y-3 overflow-y-auto pr-1">
              {messages.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "border-slate/10 bg-white text-ink"
                      : "border-slate/10 bg-white/80 text-slate/80"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {loading ? (
                <div className="rounded-2xl border border-slate/10 bg-white/80 px-4 py-3 text-sm text-slate/70">
                  Generating response...
                </div>
              ) : null}
            </div>

            <form
              className="mt-5 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <input
                className="input flex-1"
                placeholder="Type your question..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
              <button className="button-primary sm:w-32" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send"}
              </button>
            </form>
            {error ? <p className="mt-3 text-sm text-ember">{error}</p> : null}
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <p className="section-title">Public health clarified</p>
                <span className="badge bg-leaf/10 text-leaf">Verified</span>
              </div>
              <div className="mt-4 space-y-4">
                {[
                  {
                    title: "Vaccine Safety",
                    body: "Verified information about vaccine safety and efficacy."
                  },
                  {
                    title: "Nutrition Facts",
                    body: "Evidence-based guidance on nutrients and diets."
                  },
                  {
                    title: "Virus Updates",
                    body: "Current health alerts and virus prevention tips."
                  }
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate/10 bg-white/80 p-4">
                    <p className="text-sm font-semibold text-slate">{item.title}</p>
                    <p className="mt-1 text-xs text-slate/70">{item.body}</p>
                  </div>
                ))}
              </div>
              <a
                className="button-secondary mt-5 inline-flex w-full items-center justify-center"
                href="https://www.cdc.gov/"
                target="_blank"
                rel="noreferrer"
              >
                Explore topics →
              </a>
            </div>

            <div className="card">
              <p className="section-title">Fact-check focus</p>
              <h3 className="mt-2 text-lg font-semibold">What you can ask</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate/70">
                <li>Common health myths and viral claims</li>
                <li>Supplements, diets, and wellness trends</li>
                <li>Respiratory and infectious disease myths</li>
                <li>Exercise and recovery misconceptions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
