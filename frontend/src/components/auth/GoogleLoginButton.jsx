import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { errorMessage } from "@/lib/format";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// Load Google Identity Services once, shared across mounts.
function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// "Continuer avec Google" button (Google renders it; we get back a signed ID
// token and exchange it with our backend for a normal Kessia session).
// Renders nothing when VITE_GOOGLE_CLIENT_ID isn't configured.
export default function GoogleLoginButton() {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            try {
              const data = await authApi.googleLogin(credential);
              useAuthStore.getState().setAuth({ access: data.access, user: data.user });
              qc.setQueryData(["currentUser"], data.user);
              toast.success("Bienvenue sur Kessia !");
              navigate("/listings");
            } catch (err) {
              toast.error(errorMessage(err, "La connexion Google a échoué."));
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          locale: "fr",
          width: 320,
        });
      })
      .catch(() => {
        // Script blocked/offline: silently skip — password login still works.
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, qc]);

  if (!CLIENT_ID) return null;

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">ou</span>
        </div>
      </div>
      <div ref={buttonRef} className="mt-4 flex justify-center" />
      <p className="mt-3 text-center text-xs text-muted-foreground">
        En continuant avec Google, vous acceptez les{" "}
        <Link to="/cgu" target="_blank" className="font-medium text-primary hover:underline">
          CGU
        </Link>{" "}
        et la{" "}
        <Link
          to="/confidentialite"
          target="_blank"
          className="font-medium text-primary hover:underline"
        >
          politique de confidentialité
        </Link>
        .
      </p>
    </div>
  );
}
