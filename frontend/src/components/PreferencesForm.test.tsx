import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PreferencesForm from "./PreferencesForm";
import type { PreferencesOptions } from "../lib/api";

const options: PreferencesOptions = {
  cities: [{ id: "new_york", name: "New York", airports: ["JFK"] }],
  cards: [{ id: "gold", name: "Amex Gold", issuer: "amex" }],
  destination_interests: [{ id: "europe", label: "Europe" }],
  cabin_preferences: [{ id: "business", label: "Business" }],
  date_flexibility_options: [{ id: "fixed", label: "Fixed dates" }],
};

describe("PreferencesForm validation", () => {
  it("shows required field messages when submitting an empty form", async () => {
    const onSubmit = vi.fn();
    render(<PreferencesForm options={options} submitLabel="Save" onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Please complete all required fields before saving."),
    ).toBeInTheDocument();
    expect(screen.getByText("Please select your home city.")).toBeInTheDocument();
    expect(screen.getByText("Please select at least one rewards card.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears the city error after a city is selected", async () => {
    render(<PreferencesForm options={options} submitLabel="Save" onSubmit={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Please select your home city.")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText(/Home city/i), "new_york");

    expect(screen.queryByText("Please select your home city.")).not.toBeInTheDocument();
  });
});
