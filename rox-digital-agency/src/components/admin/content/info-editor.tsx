import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSiteContentAdmin } from "@/hooks/use-site-content";
import { Field, ListEditor } from "./shared";

export function InfoEditor() {
  const { content, actions } = useSiteContentAdmin();
  const [email, setEmail] = useState(content.info.email);
  const [phone, setPhone] = useState(content.info.phone);
  const [whatsapp, setWhatsapp] = useState(content.info.whatsapp);
  const [cities, setCities] = useState<string[]>([...content.info.cities]);

  const save = () =>
    actions.setInfo({
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      cities: cities.map((c) => c.trim()).filter(Boolean),
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
