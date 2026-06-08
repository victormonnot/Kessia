import { Link } from "react-router-dom";
import { Stethoscope } from "lucide-react";

import { useAuthStore } from "@/store/authStore";

const PLATFORM_COLUMN = {
  title: "Plateforme",
  links: [
    { to: "/listings", label: "Annonces" },
    { to: "/requests", label: "Demandes" },
  ],
};

const LEGAL_COLUMN = {
  title: "Légal",
  links: [
    { to: "/mentions-legales", label: "Mentions légales" },
    { to: "/cgu", label: "CGU" },
    { to: "/confidentialite", label: "Confidentialité" },
  ],
};

export default function Footer() {
  const user = useAuthStore((s) => s.user);
  const dashboardPath = user?.is_writer ? "/dashboard/writer" : "/dashboard/doctor";

  // Logged in: surface account shortcuts (mirrors the navbar menu); logged out:
  // the sign-in / sign-up entry points.
  const accountColumn = {
    title: "Compte",
    links: user
      ? [
          { to: dashboardPath, label: "Tableau de bord" },
          { to: "/messages", label: "Messagerie" },
          { to: "/settings", label: "Paramètres" },
        ]
      : [
          { to: "/login", label: "Se connecter" },
          { to: "/register", label: "S'inscrire" },
        ],
  };

  const columns = [PLATFORM_COLUMN, accountColumn, LEGAL_COLUMN];

  return (
    <footer className="border-t bg-card">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 font-bold text-primary">
            <Stethoscope className="size-5" /> Kessia
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            La marketplace de la rédaction médicale.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm font-semibold">{col.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t py-4">
        <p className="container text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kessia — Marketplace de rédaction médicale
        </p>
      </div>
    </footer>
  );
}
