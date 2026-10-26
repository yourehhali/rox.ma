// Morocco-focused FAQ content, one tailored set per page. Reused by the <Faq />
// section and the FAQPage JSON-LD so the visible answers and the structured
// data always match.

export type FaqItemData = { q: string; a: string };

export const FAQS = {
  general: [
    {
      q: "Combien coûte un site web professionnel ?",
      a: "Un site vitrine avec mise en place du SEO local démarre autour de 2 000 à 3 000 DH, selon le nombre de pages et les fonctionnalités. Le devis est précis et validé avec vous avant le début du travail.",
    },
    {
      q: "Combien de temps faut-il pour mettre un site en ligne ?",
      a: "En général quelques semaines, de la maquette Figma à la mise en ligne, selon la taille du projet et la rapidité de vos retours sur la maquette. Le calendrier est fixé ensemble au départ.",
    },
    {
      q: "Le SEO local, c'est pour quel type d'entreprise ?",
      a: "Pour toute entreprise qui travaille dans une zone géographique : commerce, artisanat, restauration, services à domicile, cabinets, etc. L'objectif est d'apparaître quand un client cherche votre métier dans votre ville.",
    },
    {
      q: "Pourquoi le suivi SEO est-il mensuel ?",
      a: "Le référencement n'est pas un réglage unique : il faut publier, ajuster et suivre ce qui fonctionne. Le forfait mensuel de 700 à 1 200 DH couvre ce travail continu, sans engagement long si vous le souhaitez.",
    },
    {
      q: "L'hébergement est-il inclus ?",
      a: "Oui, la première année d'hébergement mutualisé est offerte sur les projets éligibles. Nous configurons et mettons le site en ligne avec vous, sans manipulation technique de votre côté.",
    },
    {
      q: "Je pourrai modifier mon site moi-même ?",
      a: "Sur les projets WordPress/Elementor, oui : vous prenez en main l'outil avec une courte formation. Sur les sites développés sur-mesure, les modifications passent par nous, simplement et au tarif annoncé.",
    },
  ],

  home: [
    {
      q: "Travaillez-vous avec des entreprises de tout le Maroc ?",
      a: "Oui. Basés à Oujda, nous accompagnons des entreprises partout au Maroc — Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir et ailleurs. Tout se fait à distance (visio, téléphone, espace client), avec des échanges en français ou en darija.",
    },
    {
      q: "Faut-il déjà avoir un site pour commencer ?",
      a: "Non. Que vous partiez de zéro ou que vous vouliez refaire un site existant, la première étape est un simple échange sur votre activité et vos objectifs.",
    },
    {
      q: "Un site suffit-il, ou faut-il aussi le SEO ?",
      a: "Les deux se complètent : le site convertit vos visiteurs en demandes, le SEO les fait venir. Nous travaillons les deux ensemble dès la conception.",
    },
  ],

  methode: [
    {
      q: "Dois-je valider chaque étape ?",
      a: "Oui. Vous validez la maquette Figma avant tout développement, ce qui évite les surprises et rend les retours beaucoup moins coûteux qu'après la mise en ligne.",
    },
    {
      q: "Combien de temps dure chaque étape ?",
      a: "Le cadrage prend quelques jours, la maquette une à deux semaines, puis le développement et la mise en ligne. Le calendrier complet est fixé ensemble dès le départ.",
    },
    {
      q: "Que se passe-t-il après la mise en ligne ?",
      a: "Nous restons disponibles pour les ajustements et, si vous le souhaitez, nous assurons un suivi SEO mensuel pour continuer à progresser.",
    },
  ],

  apropos: [
    {
      q: "Où êtes-vous basés ?",
      a: "À Oujda, au Maroc. Nous travaillons avec des entreprises dans tout le pays, essentiellement à distance, avec un accompagnement humain et réactif.",
    },
    {
      q: "En quelles langues échange-t-on ?",
      a: "En français ou en darija, selon votre préférence. Chaque demande est lue et traitée par une personne, jamais par une réponse automatique.",
    },
    {
      q: "Pourquoi les tarifs sont-ils affichés ?",
      a: "Par transparence. Les fourchettes sont publiées sur le site et le devis détaillé est validé avec vous avant tout début de travail — pas de surprise.",
    },
  ],

  portfolio: [
    {
      q: "Puis-je voir des exemples concrets avant de me décider ?",
      a: "Oui, cette page présente une sélection de nos réalisations : sites vitrines, SEO local et refontes pour des entreprises marocaines de secteurs variés.",
    },
    {
      q: "Mon secteur sera-t-il représenté ?",
      a: "Nous travaillons avec les commerces, l'artisanat, la restauration, les services, les cabinets et les TPE/PME. Votre projet ressemblera à l'un de ces cas, adapté à votre activité.",
    },
    {
      q: "Comment mon projet pourrait-il être montré ici ?",
      a: "Il suffit de démarrer un projet : une fois votre site en ligne et référencé, nous pouvons l'ajouter à la galerie avec votre accord.",
    },
  ],

  contact: [
    {
      q: "Le premier échange est-il payant ?",
      a: "Non. Décrivez votre besoin, nous revenons avec un premier avis et un périmètre, sans engagement.",
    },
    {
      q: "Sous quel délai répondez-vous ?",
      a: "Chaque demande est traitée manuellement ; vous recevez une réponse personnalisée rapidement, en français ou en darija.",
    },
    {
      q: "Puis-je juste poser une question sans demander de devis ?",
      a: "Bien sûr. Une simple question sur votre visibilité en ligne est déjà un très bon point de départ.",
    },
  ],

  seo: [
    {
      q: "Le SEO local fonctionne-t-il vraiment au Maroc ?",
      a: "Oui : une large part des recherches commerciales et de services se font sur Google, souvent avec la ville dans la requête. Apparaître en premier sur « votre métier + votre ville » capte des clients prêts à acheter.",
    },
    {
      q: "Au bout de combien de temps voit-on des résultats ?",
      a: "Les premiers signes apparaissent en quelques semaines, les résultats durables se consolident sur plusieurs mois. Le SEO est un travail continu, pas un réglage unique.",
    },
    {
      q: "Fiche Google et site : les deux sont nécessaires ?",
      a: "Idéalement oui. Une fiche Google Business Profile complète renforce votre visibilité locale et crédibilise le site ; nous vous aidons à les aligner.",
    },
  ],

  web: [
    {
      q: "Le site sera-t-il rapide et adapté au mobile ?",
      a: "Oui. La majorité du trafic au Maroc vient du mobile : nous concevons d'abord pour le téléphone, puis adaptons à l'ordinateur, avec un souci constant de vitesse.",
    },
    {
      q: "Le SEO est-il intégré dès le départ ?",
      a: "Oui, la base technique (structure, balises, vitesse) est optimisée pour le référencement dès la conception, pas ajoutée après coup.",
    },
    {
      q: "Le site m'appartient ?",
      a: "Totalement. Vous êtes propriétaire de votre nom de domaine et de votre site, que vous pouvez faire évoluer avec nous ou en autonomie.",
    },
  ],

  figma: [
    {
      q: "Pourquoi valider une maquette avant de coder ?",
      a: "Parce que modifier une maquette coûte bien moins cher que modifier un site déjà développé. Vous voyez le résultat final avant d'investir.",
    },
    {
      q: "Suis-je obligé d'avancer moi-même sur Figma ?",
      a: "Non. Nous préparons la maquette et vous la consultez via un lien partageable, en la commentant simplement — aucune compétence technique requise.",
    },
  ],

  wordpress: [
    {
      q: "WordPress ou sur-mesure : lequel choisir ?",
      a: "Si vous voulez gérer et faire évoluer vos contenus vous-même, WordPress/Elementor est idéal. Pour un site très spécifique et optimisé sur mesure, nous développons sur-mesure. Nous vous conseillons selon votre cas.",
    },
    {
      q: "Qui s'occupe des mises à jour et de la sécurité ?",
      a: "Nous encadrons les sauvegardes et les mises à jour pour garder le site sûr, et vous gardez la main sur vos contenus quotidiens.",
    },
  ],

  hebergement: [
    {
      q: "L'hébergement est vraiment offert ?",
      a: "La première année d'hébergement mutualisé est offerte sur les projets éligibles. Le domaine, le HTTPS et la mise en ligne sont configurés avec vous.",
    },
    {
      q: "Et après la première année ?",
      a: "L'hébergement se renouvelle à un tarif raisonnable et annoncé à l'avance. Vous gardez votre site, sans blocage technique.",
    },
  ],
} satisfies Record<string, FaqItemData[]>;
