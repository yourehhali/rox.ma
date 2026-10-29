import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientUser } from "@/hooks/use-client-auth";

export function ProfilePanel({ user }: { user: ClientUser }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Mon compte</CardTitle>
          <CardDescription>Informations associées à votre espace client.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Nom" value={user.name} />
          <Row label="WhatsApp" value={user.phone ?? "—"} />
          {user.email ? <Row label="E-mail" value={user.email} /> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>À propos de cet espace</CardTitle>
          <CardDescription>Vos données côté ROX.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Vos demandes, messages et réservations sont enregistrés sur nos serveurs et synchronisés
            en temps réel avec le tableau de bord de l'équipe ROX.
          </p>
          <p>
            Pour toute question sur l'utilisation de vos données, contactez-nous directement depuis
            la messagerie.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
