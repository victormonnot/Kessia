import { useEffect, useState } from "react";

import Router from "@/router";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EmailVerificationBanner from "@/components/layout/EmailVerificationBanner";
import ConsentBanner from "@/components/layout/ConsentBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LoadingBlock } from "@/components/feedback/Spinner";
import { Toaster } from "@/components/ui/sonner";
import { refreshAccessToken } from "@/api/client";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      // A persisted user implies a likely refresh cookie: revive the session by
      // exchanging it for a fresh in-memory access token. On failure, log out.
      if (useAuthStore.getState().user) {
        try {
          await refreshAccessToken();
        } catch {
          useAuthStore.getState().clear();
        }
        // Session revived: re-sync the profile so persisted data (e.g. avatar)
        // can't go stale across reloads.
        if (useAuthStore.getState().accessToken) {
          try {
            const me = await authApi.me();
            if (active) useAuthStore.getState().setUser(me);
          } catch {
            // Non-fatal: keep the persisted user.
          }
        }
      }
      if (active) setReady(true);
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingBlock label="Chargement de Kessia…" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Aller au contenu
      </a>
      <Navbar />
      <EmailVerificationBanner />
      <main id="main-content" className="flex-1">
        <ErrorBoundary>
          <Router />
        </ErrorBoundary>
      </main>
      <Footer />
      <ConsentBanner />
      <Toaster richColors closeButton position="top-right" />
    </div>
  );
}
