import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import KessiaScore from "./KessiaScore";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/kessia-score"]}>
      <KessiaScore />
    </MemoryRouter>,
  );
}

describe("Kessia Score page", () => {
  it("renders the hero and the upcoming-tool messaging", () => {
    renderPage();
    expect(
      screen.getByRole("heading", {
        name: /Estimez vos chances de publication avant de soumettre/i,
      }),
    ).toBeInTheDocument();
    // L'outil n'est pas encore disponible : le bouton d'analyse est désactivé.
    expect(
      screen.getByRole("button", { name: /Analyse bientôt disponible/i }),
    ).toBeDisabled();
  });

  it("renders the sample report and the waitlist form", () => {
    renderPage();
    // Aperçu du rapport (données d'exemple).
    expect(screen.getByText("78%")).toBeInTheDocument();
    // Capture d'e-mail de la liste d'attente.
    expect(screen.getByLabelText(/Votre adresse e-mail/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Questions fréquentes/i }),
    ).toBeInTheDocument();
  });
});
