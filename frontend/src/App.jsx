import { useEffect, useState } from "react";

import Router from "@/router";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { refreshAccessToken } from "@/api/client";
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
      <div className="flex min-h-screen items-center justify-center text-neutral-500">
        Chargement…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Router />
      </main>
      <Footer />
    </div>
  );
}
