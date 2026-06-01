// Static legal pages. Kessia is a student capstone (Holberton) — the content
// below is illustrative and states that explicitly rather than impersonating a
// real legal entity.

const DOCS = {
  mentions: {
    title: "Mentions légales",
    updated: "1er juin 2026",
    sections: [
      {
        heading: "Éditeur",
        body: "Kessia est un projet étudiant réalisé dans le cadre du capstone de Holberton School, à but pédagogique et de démonstration. Il ne s'agit pas d'une entité commerciale et aucune transaction réelle n'y est traitée en dehors d'un environnement de test.",
      },
      {
        heading: "Hébergement",
        body: "L'application est déployée à des fins de démonstration. Les services tiers utilisés (paiements, e-mails) le sont en mode test.",
      },
      {
        heading: "Propriété intellectuelle",
        body: "Les contenus publiés par les utilisateurs (annonces, demandes, messages, livrables) restent la propriété de leurs auteurs respectifs.",
      },
      {
        heading: "Contact",
        body: "Pour toute question relative à ce projet de démonstration, utilisez la messagerie intégrée de la plateforme.",
      },
    ],
  },
  cgu: {
    title: "Conditions générales d'utilisation",
    updated: "1er juin 2026",
    sections: [
      {
        heading: "Objet",
        body: "Kessia met en relation des médecins et des rédacteurs scientifiques pour des prestations de rédaction médicale. Les présentes conditions encadrent l'utilisation de la plateforme.",
      },
      {
        heading: "Compte et rôles",
        body: "La création d'un compte est nécessaire pour commander, publier une demande ou proposer ses services. Chaque utilisateur peut être médecin et activer à tout moment le mode rédacteur.",
      },
      {
        heading: "Commandes et paiements",
        body: "Le paiement d'une commande est placé sous séquestre et n'est versé au rédacteur qu'après validation de la livraison par le médecin. Une commission de plateforme de 15 % est appliquée. Les paiements sont opérés via Stripe.",
      },
      {
        heading: "Responsabilités",
        body: "Les utilisateurs s'engagent à fournir des informations exactes et à respecter la déontologie applicable à la rédaction médicale. Kessia n'est pas responsable du contenu des livrables échangés.",
      },
    ],
  },
  confidentialite: {
    title: "Politique de confidentialité",
    updated: "1er juin 2026",
    sections: [
      {
        heading: "Données collectées",
        body: "Nous collectons les informations de compte (nom, e-mail, bio) et les données nécessaires au fonctionnement du service (annonces, demandes, commandes, messages).",
      },
      {
        heading: "Utilisation des données",
        body: "Vos données servent uniquement à fournir le service : mise en relation, suivi des commandes, messagerie et notifications par e-mail liées à votre activité.",
      },
      {
        heading: "Paiements",
        body: "Les informations de paiement sont traitées directement par Stripe et ne transitent pas par nos serveurs. Nous ne stockons aucune donnée de carte bancaire.",
      },
      {
        heading: "Sécurité et cookies",
        body: "L'authentification repose sur un jeton de session stocké dans un cookie httpOnly et une protection CSRF. Aucun cookie publicitaire ou de pistage n'est utilisé.",
      },
      {
        heading: "Vos droits",
        body: "Vous pouvez consulter et modifier vos informations depuis vos paramètres de compte. S'agissant d'un projet de démonstration, les données peuvent être réinitialisées à tout moment.",
      },
    ],
  },
};

export default function LegalPage({ doc }) {
  const data = DOCS[doc];
  if (!data) return null;
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Dernière mise à jour : {data.updated}
      </p>
      <div className="mt-8 space-y-8">
        {data.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-semibold">{s.heading}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {s.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
