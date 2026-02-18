"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatPregunta } from "@/lib/api";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; text: string };

function formatResponse(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "👋 ¡Hola! Soy tu asistente de logística. Pregúntame sobre embarques, pendientes o estadísticas.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = (input || "").trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);
    try {
      const { respuesta } = await chatPregunta(text);
      setMessages((prev) => [...prev, { role: "assistant", text: formatResponse(respuesta) }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error de conexión. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl transition-all hover:scale-105 hover:shadow-2xl",
          open ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
        )}
        size="icon"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </Button>

      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 flex w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all duration-300 origin-bottom-right",
          open
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-4 opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-primary to-violet-600 px-4 py-4 text-primary-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="font-semibold leading-none">Asistente Virtual</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-primary-foreground/80">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              En línea
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex h-[400px] flex-col gap-4 overflow-y-auto bg-muted/30 p-4"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex w-full",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                  m.role === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-white dark:bg-card border border-border"
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white dark:bg-card border border-border px-4 py-3 shadow-sm">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-0"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-150"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-300"></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <form
          className="flex gap-2 border-t border-border bg-background p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu consulta..."
            className="flex-1 rounded-full border-muted-foreground/20 bg-muted/50 focus-visible:ring-primary/20"
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !input.trim()}
            className="rounded-full h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
