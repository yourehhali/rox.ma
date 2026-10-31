import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSiteContentAdmin } from "@/hooks/use-site-content";
import { Field, ListEditor } from "./shared";

export function InfoEditor() {
  const { content, actions } = useSiteContentAdmin();
  const [email, setEmail] = useState(content.info.email);
  const [phone, setPhone] = useState(content.info.phone);
  const [whatsapp, setWhatsapp] = useState(content.info.whatsapp);
  const [cities, setCities] = useState<string[]>([...content.info.cities]);
  const [waEnabled, setWaEnabled] = useState(content.info.whatsappEnabled);
  const [waMessage, setWaMessage] = useState(content.info.whatsappMessage);
  const [waPosition, setWaPosition] = useState<"left" | "right">(content.info.whatsappPosition);

  const save = () =>
    actions.setInfo({
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      cities: cities.map((c) => c.trim()).filter(Boolean),
      whatsappEnabled: waEnabled,
      whatsappMessage: waMessage.trim(),
      whatsappPosition: waPosition,
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coordonnées directes</CardTitle>
          <CardDescription>
            Laissez vide tant que vous n'avez pas d'information réelle à afficher — rien de fictif
            n'apparaîtra sur le site.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="E-mail">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@…"
            />
          </Field>
          <Field label="Téléphone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212 …" />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+212 …"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bouton WhatsApp flottant</CardTitle>
          <CardDescription>
            Bulle fixe visible sur tout le site public. Elle n'apparaît que si elle est activée{" "}
            <span className="font-medium">et</span> qu'un numéro WhatsApp est renseigné ci-dessus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="wa-enabled" className="cursor-pointer text-sm font-medium">
              Afficher la bulle WhatsApp
            </Label>
            <Switch id="wa-enabled" checked={waEnabled} onCheckedChange={setWaEnabled} />
          </div>
          <Field label="Message pré-rempli (optionnel)">
            <Textarea
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
              placeholder="Bonjour, je souhaite un devis pour…"
              rows={3}
            />
          </Field>
          <Field label="Position">
            <Select
              value={waPosition}
              onValueChange={(v) => setWaPosition(v === "left" ? "left" : "right")}
            >
              <SelectTrigger className="w-full sm:max-w-[16rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="right">Bas droite</SelectItem>
                <SelectItem value="left">Bas gauche</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zones desservies</CardTitle>
          <CardDescription>
            Villes affichées dans le bloc « Zones desservies » sur tout le site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListEditor
            label="Villes"
            items={cities}
            onChange={setCities}
            placeholder="Casablanca"
            addLabel="Ajouter une ville"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save}>
          <Save size={15} /> Enregistrer
        </Button>
      </div>
    </div>
  );
}
