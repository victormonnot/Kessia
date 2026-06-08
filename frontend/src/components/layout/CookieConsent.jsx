import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "kessia-cookie-consent";

function readChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode / SSR): treat as already handled.
    return "unavailable";
  }
}

// Site-wide cookie notice. Kessia only sets essential (auth) cookies, so this is
// informational consent: either choice dismisses it and is remembered locally.
export default function CookieConsent() {
  const [choice, setChoice] = useState(readChoice);

  if (choice) return null;

  const decide = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore: we still dismiss the banner for this session.
    }
    setChoice(value);
  };

  return (
    <div
      role="region"
      aria-label="Bandeau cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
    >
      <div className="container flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Kessia n'utilise que des cookies essentiels au fonctionnement du service
          (authentification) — aucun cookie publicitaire ou de pistage. En savoir plus dans notre{" "}
          <Link to="/confidentialite" className="font-medium text-primary hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
        {/* Equal-weight choices: accept and refuse share the same styling so
            neither is nudged (GDPR "fair choice"). */}
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => decide("refused")}>
            Refuser
          </Button>
          <Button variant="outline" size="sm" onClick={() => decide("accepted")}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
