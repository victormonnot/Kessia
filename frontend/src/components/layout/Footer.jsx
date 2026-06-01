import { Link } from "react-router-dom";
import { Stethoscope } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <Stethoscope className="size-5" />
          Kessia
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/listings" className="hover:text-foreground">
            Annonces
          </Link>
          <Link to="/requests" className="hover:text-foreground">
            Demandes
          </Link>
        </nav>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kessia — Marketplace de rédaction médicale
        </p>
      </div>
    </footer>
  );
}
