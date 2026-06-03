"use client";

import { useEffect, useRef, useState } from "react";
import { IconX } from "@/lib/icons";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "I want to cook a recipe — what do we have at home?",
  "What can I cook tonight?",
];

export function PantryChat() {
  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [streaming, setStreaming]     = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll whenever messages or live text changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [open]);

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const userMsg: Message = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    // Recipe suggestion shortcut — just ask for the link, no API call
    if (content === SUGGESTIONS[0]) {
      setMessages([...newMessages, {
        role: "assistant",
        content: "Paste the recipe link and I'll check what you have at home! 👇",
      }]);
      return;
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              setStreamingText(accumulated);
            }
          } catch { /* ignore malformed */ }
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: accumulated }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setStreaming(false);
      setStreamingText("");
    }
  }

  const font: React.CSSProperties = { fontFamily: "'Jost', system-ui, sans-serif" };

  return (
    <>
      {/* ── Chat panel ── */}
      <div
        role="dialog"
        aria-label="Pantry AI chat"
        style={{
          position:      "fixed",
          bottom:        88,
          right:         20,
          zIndex:        99,
          width:         380,
          maxWidth:      "calc(100vw - 32px)",
          height:        520,
          maxHeight:     "calc(100vh - 120px)",
          borderRadius:  20,
          background:    "var(--bg)",
          boxShadow:     "0 8px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)",
          border:        "1px solid var(--border)",
          display:       open ? "flex" : "none",
          flexDirection: "column",
          overflow:      "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding:        "14px 16px",
          borderBottom:   "1px solid var(--border)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          flexShrink:     0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🥫</span>
            <span style={{ ...font, fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>
              Pantry AI
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            style={{
              all:        "unset",
              cursor:     "pointer",
              color:      "var(--muted)",
              display:    "flex",
              alignItems: "center",
              padding:    4,
              borderRadius: 6,
            }}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Message list */}
        <div style={{
          flex:          1,
          overflowY:     "auto",
          padding:       "12px 12px 8px",
          display:       "flex",
          flexDirection: "column",
          gap:           10,
        }}>
          {messages.length === 0 && !streaming && (
            <div style={{
              flex:           1,
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              gap:            8,
              padding:        "24px 16px",
              textAlign:      "center",
            }}>
              <div style={{ fontSize: 36, opacity: 0.25 }}>💬</div>
              <div style={{ ...font, fontWeight: 600, fontSize: 15, color: "var(--muted)" }}>
                Ask about your pantry
              </div>
              <div style={{ ...font, fontSize: 13, color: "var(--faint)", lineHeight: 1.5 }}>
                Paste a recipe, ask what to cook tonight, or check what&apos;s expiring soon.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, justifyContent: "center" }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    style={{
                      ...font,
                      fontSize:     13,
                      padding:      "5px 12px",
                      borderRadius: 20,
                      border:       "1.5px solid var(--border)",
                      background:   "var(--surface-2)",
                      color:        "var(--ink)",
                      cursor:       "pointer",
                      whiteSpace:   "nowrap",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf:   msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth:    "85%",
                background:  msg.role === "user" ? "var(--accent)" : "var(--surface-2)",
                color:       msg.role === "user" ? "#fff" : "var(--ink)",
                padding:     "9px 13px",
                borderRadius: msg.role === "user"
                  ? "16px 16px 4px 16px"
                  : "16px 16px 16px 4px",
                fontSize:   14,
                lineHeight: 1.55,
                ...font,
                whiteSpace:    "pre-wrap",
                wordBreak:     "break-word",
              }}
            >
              {msg.content}
            </div>
          ))}

          {/* Live streaming bubble */}
          {streaming && (
            <div style={{
              alignSelf:    "flex-start",
              maxWidth:     "85%",
              background:   "var(--surface-2)",
              color:        "var(--ink)",
              padding:      "9px 13px",
              borderRadius: "16px 16px 16px 4px",
              fontSize:     14,
              lineHeight:   1.55,
              ...font,
              whiteSpace:   "pre-wrap",
              wordBreak:    "break-word",
              minWidth:     40,
            }}>
              {streamingText || (
                <span style={{ opacity: 0.45, letterSpacing: 2 }}>•••</span>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding:     "10px 12px",
          borderTop:   "1px solid var(--border)",
          display:     "flex",
          gap:         8,
          alignItems:  "flex-end",
          flexShrink:  0,
          background:  "var(--bg)",
        }}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            placeholder="Ask anything about your pantry…"
            disabled={streaming}
            onChange={e => { setInput(e.target.value); autoResize(e.target); }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            style={{
              flex:        1,
              resize:      "none",
              border:      "1.5px solid var(--border)",
              borderRadius: 14,
              padding:     "8px 12px",
              ...font,
              fontSize:    14,
              color:       "var(--ink)",
              background:  "var(--field-bg)",
              outline:     "none",
              overflowY:   "auto",
              lineHeight:  1.45,
              maxHeight:   100,
              opacity:     streaming ? 0.6 : 1,
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            aria-label="Send"
            style={{
              width:          36,
              height:         36,
              borderRadius:   "50%",
              background:     "var(--accent)",
              color:          "#fff",
              border:         "none",
              cursor:         !input.trim() || streaming ? "default" : "pointer",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
              opacity:        !input.trim() || streaming ? 0.35 : 1,
              transition:     "opacity 0.15s",
            }}
          >
            {/* Send arrow */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Floating trigger button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close pantry chat" : "Open pantry chat"}
        style={{
          position:       "fixed",
          bottom:         24,
          right:          20,
          zIndex:         100,
          width:          52,
          height:         52,
          borderRadius:   "50%",
          background:     "var(--accent)",
          color:          "#fff",
          border:         "none",
          cursor:         "pointer",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          boxShadow:      "0 4px 16px rgba(45,92,176,0.4)",
          transition:     "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.07)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        {open ? (
          <IconX size={20} />
        ) : (
          // Chat bubble icon
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>
    </>
  );
}
