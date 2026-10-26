import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServicesEditor } from "./content/services-editor";
import { PricingEditor } from "./content/pricing-editor";
import { FaqEditor } from "./content/faq-editor";
import { InfoEditor } from "./content/info-editor";

export function ContentPanel() {
  return (
    <Tabs defaultValue="services" className="space-y-6">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="offres">Offres &amp; tarifs</TabsTrigger>
        <TabsTrigger value="faq">FAQ</TabsTrigger>
        <TabsTrigger value="infos">Coordonnées &amp; zones</TabsTrigger>
      </TabsList>

      <TabsContent value="services">
        <ServicesEditor />
      </TabsContent>
      <TabsContent value="offres">
        <PricingEditor />
      </TabsContent>
      <TabsContent value="faq">
        <FaqEditor />
      </TabsContent>
      <TabsContent value="infos">
        <InfoEditor />
      </TabsContent>
    </Tabs>
  );
}
