// Admin WhatsApp (OpenWA) OTP gateway panel. Configure the channel (enable,
// base URL, API key, session name, message template), watch gateway + session
// health, create/start the WhatsApp session, pair it by scanning the QR (rox-api
// proxies OpenWA so its dashboard stays internal), and send a test OTP.
//
// Structure mirrors BoardPanel/ContentPanel: TanStack Query against
// `services/whatsapp`, French copy, inline banners for success/error.

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  Save,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { keys } from "@/hooks/queries/keys";
import {
  createSession,
  getQr,
  getSettings,
  getStatus,
  putSettings,
  sendTest,
  startSession,
} from "@/services/whatsapp";
import type { WhatsAppSettingsInput } from "@/lib/api/types";

type FormState = {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  sessionName: string;
  messageTemplate: string;
  notifyEnabled: boolean;
  notifyPhone: string;
};

const EMPTY_FORM: FormState = {
  enabled: false,
  baseUrl: "",
  apiKey: "",
  sessionName: "",
  messageTemplate: "",
  notifyEnabled: false,
  notifyPhone: "",
};

function errMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function WhatsAppPanel() {
  const qc = useQueryClient();

  const { data: settings, isLoading, isError: settingsError } = useQuery({
    queryKey: keys.whatsapp.settings(),
    queryFn: getSettings,
  });
  const { data: status, refetch: refetchStatus, isFetching: statusFetching } = useQuery({
    queryKey: keys.whatsapp.status(),
    queryFn: getStatus,
  });

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [qrActive, setQrActive] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [testErr, setTestErr] = useState<string | null>(null);

  // Hydrate the form once settings arrive. The API key is never prefilled —
  // an empty field means "keep the stored key".
  useEffect(() => {
    if (!settings) return;
    setForm({
      enabled: settings.enabled,
      baseUrl: settings.baseUrl ?? "",
      apiKey: "",
      sessionName: settings.sessionName ?? "",
      messageTemplate: settings.messageTemplate ?? "",
      notifyEnabled: settings.notifyEnabled,
      notifyPhone: settings.notifyPhone ?? "",
    });
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: (input: WhatsAppSettingsInput) => putSettings(input),
    onSuccess: (data) => {
      qc.setQueryData(keys.whatsapp.settings(), data);
      qc.invalidateQueries({ queryKey: keys.whatsapp.status() });
      setSaveErr(null);
      setSaveMsg("Paramètres enregistrés.");
    },
    onError: (err) => {
      setSaveMsg(null);
      setSaveErr(errMessage(err, "Enregistrement impossible."));
    },
    // Inline banners already report every failure in this panel.
    meta: { silentError: true },
  });

  const createMut = useMutation({
    mutationFn: createSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.whatsapp.status() }),
    meta: { silentError: true },
  });
  const startMut = useMutation({
    mutationFn: startSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.whatsapp.status() });
      setQrActive(true);
    },
    meta: { silentError: true },
  });

  // Poll the QR only while pairing is active; stop once the session is ready.
  const { data: qr } = useQuery({
    queryKey: keys.whatsapp.qr(),
    queryFn: getQr,
    enabled: qrActive,
    refetchInterval: (q) => (q.state.data?.status === "ready" ? false : 3000),
  });
  useEffect(() => {
    if (qr?.status === "ready") {
      setQrActive(false);
      qc.invalidateQueries({ queryKey: keys.whatsapp.status() });
    }
  }, [qr, qc]);

  const testMut = useMutation({
    mutationFn: (phone: string) => sendTest(phone),
    onSuccess: (res) => {
      setTestErr(null);
      setTestMsg(
        res.sent ? "Message de test envoyé." : res.error ?? "Échec de l'envoi.",
      );
      if (!res.sent) setTestErr(res.error ?? "Échec de l'envoi."), setTestMsg(null);
    },
    onError: (err) => {
      setTestMsg(null);
      setTestErr(errMessage(err, "Envoi impossible."));
    },
    meta: { silentError: true },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement de la configuration WhatsApp…</p>;
  }

  const sessionStatus = status?.sessionStatus ?? null;
  const hasSession = Boolean(status?.sessionId);

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">État de la passerelle</CardTitle>
            <CardDescription>
              rox-api interroge OpenWA en interne — le tableau de bord OpenWA reste privé.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStatus()}
            disabled={statusFetching}
          >
            <RefreshCw size={14} className={statusFetching ? "animate-spin" : undefined} />
            Actualiser
          </Button>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <StatusPill
            label={status?.enabled ? "Canal activé" : "Canal désactivé"}
            tone={status?.enabled ? "ok" : "muted"}
          />
          <StatusPill
            label={status?.reachable ? "Passerelle joignable" : "Passerelle injoignable"}
            tone={status?.reachable ? "ok" : "bad"}
          />
          {status?.sessionStatus && (
            <StatusPill
              label={`Session : ${status.sessionStatus}`}
              tone={status.sessionPaired ? "ok" : status.sessionStatus === "qr_ready" ? "warn" : "muted"}
            />
          )}
          {status?.gatewayError && (
            <span className="text-xs text-destructive">{status.gatewayError}</span>
          )}
        </CardContent>
      </Card>

      {/* Configuration form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
          <CardDescription>
            Activez l'envoi du code de vérification par WhatsApp en plus de l'e-mail. L'e-mail
            reste le canal de référence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <Label htmlFor="wa-enabled" className="cursor-pointer">
              Activer l'envoi WhatsApp
            </Label>
            <Switch
              id="wa-enabled"
              checked={form.enabled}
              onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="URL de la passerelle OpenWA" htmlFor="wa-base">
              <Input
                id="wa-base"
                value={form.baseUrl}
                onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
                placeholder="http://openwa:2785"
              />
            </Field>
            <Field label="Nom de session" htmlFor="wa-session">
              <Input
                id="wa-session"
                value={form.sessionName}
                onChange={(e) => setForm((f) => ({ ...f, sessionName: e.target.value }))}
                placeholder="rox"
              />
            </Field>
          </div>

          <Field label="Clé API OpenWA" htmlFor="wa-key" hint={
            settings?.apiKeySet
              ? `Enregistrée (${settings.apiKeyMasked ?? "••••••••"}) — laissez vide pour conserver.`
              : "Laissez vide pour conserver la clé enregistrée."
          }>
            <Input
              id="wa-key"
              type="password"
              autoComplete="off"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder="sk-…"
            />
          </Field>

          <Field
            label="Modèle de message"
            htmlFor="wa-template"
            hint="Placeholders : {code}, {minutes}, {name}."
          >
            <Textarea
              id="wa-template"
              value={form.messageTemplate}
              onChange={(e) => setForm((f) => ({ ...f, messageTemplate: e.target.value }))}
              placeholder="ROX — votre code de vérification : {code} (valide {minutes} min)."
            />
          </Field>

          {saveMsg && <Banner tone="ok">{saveMsg}</Banner>}
          {saveErr && <Banner tone="bad">{saveErr}</Banner>}

          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSaveMsg(null);
                setSaveErr(null);
                saveMut.mutate({
                  enabled: form.enabled,
                  baseUrl: form.baseUrl.trim(),
                  sessionName: form.sessionName.trim(),
                  messageTemplate: form.messageTemplate.trim(),
                  ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
                });
              }}
              disabled={saveMut.isPending}
            >
              {saveMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin activity notifications — same gateway, own recipient + switch */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications admin (WhatsApp)</CardTitle>
          <CardDescription>
            Recevez une alerte sur votre propre numéro à chaque activité du site : nouvelle
            commande ou demande, inscription client, message, demande d'appel, demande de
            modification. Nécessite une session OpenWA appairée, indépendante du canal OTP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <Label htmlFor="wa-notify-enabled" className="cursor-pointer">
              Activer les notifications d'activité
            </Label>
            <Switch
              id="wa-notify-enabled"
              checked={form.notifyEnabled}
              onCheckedChange={(v) => setForm((f) => ({ ...f, notifyEnabled: v }))}
            />
          </div>

          <Field
            label="Votre numéro WhatsApp"
            htmlFor="wa-notify-phone"
            hint="Format international, ex. +212 6 12 34 56 78."
          >
            <Input
              id="wa-notify-phone"
              type="tel"
              autoComplete="off"
              value={form.notifyPhone}
              onChange={(e) => setForm((f) => ({ ...f, notifyPhone: e.target.value }))}
              placeholder="+212 6 12 34 56 78"
            />
          </Field>

          {saveMsg && <Banner tone="ok">{saveMsg}</Banner>}
          {saveErr && <Banner tone="bad">{saveErr}</Banner>}

          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSaveMsg(null);
                setSaveErr(null);
                saveMut.mutate({
                  notifyEnabled: form.notifyEnabled,
                  ...(form.notifyPhone.trim() ? { notifyPhone: form.notifyPhone.trim() } : {}),
                });
              }}
              disabled={saveMut.isPending || (form.notifyEnabled && !form.notifyPhone.trim())}
            >
              {saveMut.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session pairing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appareil WhatsApp (session)</CardTitle>
          <CardDescription>
            Créez la session, démarrez-la, puis scannez le QR code depuis WhatsApp sur votre
            téléphone pour l'appareiller.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} />}
              Créer la session
            </Button>
            <Button onClick={() => startMut.mutate()} disabled={startMut.isPending || !hasSession}>
              {startMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Démarrer / afficher le QR
            </Button>
          </div>

          {createMut.isError && (
            <Banner tone="bad">{errMessage(createMut.error, "Création de session impossible.")}</Banner>
          )}
          {startMut.isError && (
            <Banner tone="bad">{errMessage(startMut.error, "Démarrage impossible.")}</Banner>
          )}

          {qrActive && qr?.qrCode && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">
                Scannez ce QR avec WhatsApp (Appareils connectés). Il se rafraîchit automatiquement.
              </p>
              <img
                src={qr.qrCode}
                alt="QR code de session WhatsApp"
                className="h-56 w-56 rounded-lg border border-border bg-white p-2"
              />
              {qr.status && <Badge variant="secondary">{qr.status}</Badge>}
            </div>
          )}
          {qrActive && !qr?.qrCode && (
            <p className="text-sm text-muted-foreground">
              En attente du QR… statut : {qr?.status ?? sessionStatus ?? "—"}.
            </p>
          )}
          {status?.sessionPaired && (
            <Banner tone="ok">Session appairée et prête — les codes seront envoyés sur WhatsApp.</Banner>
          )}
        </CardContent>
      </Card>

      {/* Test send */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test d'envoi</CardTitle>
          <CardDescription>
            Envoie un vrai message au format OTP sur le numéro saisi (format international, indicatif
            compris).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[14rem] flex-1">
              <Field label="Numéro de destination" htmlFor="wa-test-phone">
                <Input
                  id="wa-test-phone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+212600000000"
                />
              </Field>
            </div>
            <Button
              onClick={() => {
                setTestMsg(null);
                setTestErr(null);
                testMut.mutate(testPhone.trim());
              }}
              disabled={testMut.isPending || !testPhone.trim()}
            >
              {testMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Envoyer le test
            </Button>
          </div>
          {testMsg && <Banner tone="ok">{testMsg}</Banner>}
          {testErr && <Banner tone="bad">{testErr}</Banner>}
          {settingsError && (
            <Banner tone="bad">
              Impossible de charger la configuration WhatsApp. Vérifiez votre session admin.
            </Banner>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "ok" | "bad" | "warn" | "muted" }) {
  const className =
    tone === "ok"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
      : tone === "bad"
        ? "bg-destructive/10 text-destructive border-destructive/40"
        : tone === "warn"
          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
          : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {tone === "ok" && <CheckCircle2 size={12} />}
      {tone === "bad" && <AlertTriangle size={12} />}
      {label}
    </span>
  );
}

function Banner({ tone, children }: { tone: "ok" | "bad"; children: ReactNode }) {
  return (
    <div
      className={
        tone === "ok"
          ? "flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
          : "flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      }
    >
      {tone === "ok" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
      {children}
    </div>
  );
}
