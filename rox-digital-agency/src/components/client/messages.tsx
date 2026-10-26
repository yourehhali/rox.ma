import { useEffect, useRef, useState, type FormEvent } from "react";
import { Calendar, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient } from "@/components/client/client-context";
import { useChatTyping } from "@/hooks/use-chat-typing";
import { cn } from "@/lib/utils";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function MessagesPanel({ clientId }: { clientId?: string }) {
  const { data, sendMessage, bookCall } = useClient();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { typingNames, ping, stop } = useChatTyping("client", clientId, clientId);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [data.messages.length, typingNames.length]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    sendMessage(text);
    setDraft("");
    stop();
  };

  return (
    <Tabs defaultValue="chat">
      <TabsList>
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="call">Réserver un appel</TabsTrigger>
      </TabsList>

      <TabsContent value="chat">
        <div className="flex h-[28rem] flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <p className="text-sm font-medium">Conseiller ROX — en ligne</p>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {data.messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.from === "client" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    m.from === "client"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      m.from === "client" ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {formatTime(m.at)}
                  </p>
                </div>
              </div>
            ))}
            {typingNames.length > 0 && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-3.5 py-2 text-xs text-muted-foreground">
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
                  </span>
                  Conseiller ROX est en train d’écrire…
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <Input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (e.target.value.trim()) ping(true);
              }}
              onBlur={() => stop()}
              placeholder="Écrivez votre message…"
              aria-label="Message"
            />
            <Button type="submit" size="icon" aria-label="Envoyer" disabled={!draft.trim()}>
              <Send size={16} />
            </Button>
          </form>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          L'équipe ROX vous répond généralement sous 24 h ouvrées depuis son tableau de bord.
        </p>
      </TabsContent>

      <TabsContent value="call">
        <div className="grid gap-6 lg:grid-cols-2">
          <CallBookingForm onBook={bookCall} />
          <div>
            <h3 className="mb-3 font-display text-base font-semibold">Vos appels</h3>
            {data.bookings.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Aucun appel réservé pour le moment.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.bookings.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm"
                  >
                    <Calendar size={16} className="shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{b.subject || "Appel"}</p>
                      <p className="text-muted-foreground">
                        {b.date} à {b.time}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {b.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function CallBookingForm({
  onBook,
}: {
  onBook: (b: { date: string; time: string; subject: string }) => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [subject, setSubject] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    onBook({ date, time, subject: subject.trim() });
    setDone(true);
    setDate("");
    setTime("");
    setSubject("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Phone size={16} className="text-primary" />
        <h3 className="font-display text-base font-semibold">Demander un appel</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <Label htmlFor="call-date">Date</Label>
          <Input
            id="call-date"
            type="date"
            required
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setDone(false);
            }}
          />
        </label>
        <label className="block space-y-1.5">
          <Label htmlFor="call-time">Heure</Label>
          <Input
            id="call-time"
            type="time"
            required
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              setDone(false);
            }}
          />
        </label>
      </div>
      <label className="block space-y-1.5">
        <Label htmlFor="call-subject">Sujet</Label>
        <Input
          id="call-subject"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setDone(false);
          }}
          placeholder="Ex. Point sur ma maquette"
        />
      </label>
      {done && (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Demande enregistrée. Nous confirmons votre créneau.
        </p>
      )}
      <Button type="submit" className="w-full">
        Réserver le créneau
      </Button>
    </form>
  );
}
