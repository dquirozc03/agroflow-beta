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
      text: "Hola. Puedes preguntar por ejemplo: ¿Cuántos embarques salieron hoy? ¿Cuántos registros hay pendientes?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
        { role: "assistant", text: "No pude conectar con el servidor. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
        size="icon"
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      {open && (
        <div
          className={cn(
            "fixed bottom-20 right-6 z-50 flex w-[360px] max-w-[calc(100vw-3rem)] flex-col",
            "rounded-xl border border-border bg-card shadow-xl"
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-medium">Consultas</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div
            ref={scrollRef}
            className="flex max-h-[320px] min-h-[200px] flex-col gap-3 overflow-y-auto p-3"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Pensando…
              </div>
            )}
          </div>
          <form
            className="flex gap-2 border-t border-border p-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre embarques, registros…"
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
