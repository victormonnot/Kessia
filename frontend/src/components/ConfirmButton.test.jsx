import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ConfirmButton from "./ConfirmButton";

describe("ConfirmButton", () => {
  it("runs the action only after confirmation in the dialog", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmButton
        onConfirm={onConfirm}
        title="Supprimer cette annonce ?"
        confirmLabel="Supprimer"
      >
        Supprimer l'annonce
      </ConfirmButton>,
    );

    // The action is not run until the dialog is opened and confirmed.
    expect(onConfirm).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: /supprimer l'annonce/i }));
    expect(await screen.findByText("Supprimer cette annonce ?")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
