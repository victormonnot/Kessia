import { Link } from "react-router-dom";
import { FileText, MessagesSquare, ShieldCheck, Stethoscope } from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "Rédaction médicale experte",
    text: "Articles de recherche, revues et études de cas par des rédacteurs scientifiques.",
  },
  {
    icon: ShieldCheck,
    title: "Paiement sécurisé sous séquestre",
    text: "Les fonds ne sont versés au rédacteur qu'une fois la livraison validée.",
  },
  {
    icon: MessagesSquare,
    title: "Échanges en temps réel",
    text: "Une messagerie intégrée entre médecins et rédacteurs, du devis à la livraison.",
  },
];

// Two-column auth shell: a marketing panel (hidden on mobile) and the form area.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent-700"
        />
        <div
          aria-hidden
          className="absolute -right-16 -top-16 size-72 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-10 size-72 rounded-full bg-white/10 blur-2xl"
        />

        <Link to="/" className="relative flex items-center gap-2 text-xl font-bold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">
            <Stethoscope className="size-5" />
          </span>
          Kessia
        </Link>

        <div className="relative animate-fade-in">
          <h2 className="text-3xl font-bold leading-tight">
            La marketplace de la rédaction médicale.
          </h2>
          <p className="mt-3 max-w-md text-primary-foreground/80">
            Médecins et rédacteurs scientifiques, réunis sur une plateforme sécurisée.
          </p>
          <ul className="mt-10 space-y-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <f.icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-primary-foreground/80">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-primary-foreground/70">
          © {new Date().getFullYear()} Kessia
        </p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
          {footer && (
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          )}
        </div>
      </main>
    </div>
  );
}
