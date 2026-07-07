import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Reveal from "@/components/motion/Reveal";

// Questions fréquentes — lève les principales objections avant la conversion.
// Réponses alignées sur le fonctionnement réel : séquestre Stripe, vérification
// par l'équipe, révisions suivies dans l'espace commande.
const FAQS = [
  {
    q: "Comment fonctionne le paiement sécurisé ?",
    a: "À la commande, votre paiement est placé sous séquestre via Stripe. Les fonds ne sont versés au rédacteur qu'une fois le livrable reçu et validé par vos soins.",
  },
  {
    q: "Qui sont les rédacteurs ?",
    a: "Des rédacteurs scientifiques aux qualifications contrôlées par notre équipe. Les profils vérifiés affichent un badge dédié, gage de leur expertise médicale.",
  },
  {
    q: "Combien coûte une prestation ?",
    a: "Chaque rédacteur fixe librement ses tarifs : le prix « à partir de » est indiqué sur l'annonce. Pour un besoin spécifique, publiez une demande et recevez des propositions.",
  },
  {
    q: "Comment se déroule une commande ?",
    a: "Choisissez une annonce ou publiez une demande, échangez via la messagerie, recevez votre livrable, validez-le puis laissez un avis. Tout se suit depuis votre espace.",
  },
  {
    q: "Puis-je demander des révisions ?",
    a: "Oui. Selon l'offre choisie, vous pouvez demander des révisions avant de valider la livraison ; les échanges et les délais sont suivis dans l'espace de commande.",
  },
  {
    q: "Est-ce du ghostwriting ?",
    a: "Non. Kessia défend une rédaction médicale déclarée, conforme aux recommandations ICMJE et COPE : la contribution du rédacteur est reconnue de façon transparente, dans le respect de l'intégrité scientifique.",
  },
  {
    q: "Et si aucune annonce ne correspond à mon besoin ?",
    a: "Publiez une demande sur mesure : décrivez votre projet et votre budget, recevez des propositions de rédacteurs de votre spécialité, et choisissez la meilleure.",
  },
  {
    q: "Comment devenir rédacteur sur Kessia ?",
    a: "Activez le mode rédacteur depuis votre compte Kessia (le même que pour commander), complétez votre profil et vos qualifications, puis publiez vos annonces. Demandez la vérification de votre profil pour obtenir le badge Profil vérifié.",
  },
];

export default function FaqSection() {
  return (
    <section className="border-y bg-secondary/40">
      <div className="container py-10 sm:py-14">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl sm:text-3xl">Questions fréquentes</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Tout ce qu'il faut savoir avant de commander ou de rédiger.
            </p>
            <Accordion type="single" collapsible className="mt-8">
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-base">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
