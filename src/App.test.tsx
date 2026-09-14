// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import Upload from "./features/Upload";
import type { Session } from "./models/pitch";
afterEach(cleanup);
describe("pitch lab workflows", () => {
  it("filters the demo and opens a metric explanation", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("Know your arsenal.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Slider 12" }));
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === "P" && !!el.textContent?.includes("12 pitches"),
      ),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: /AVG. FASTBALL VELOCITY/ }),
    );
    expect(screen.getByRole("dialog", { name: "Velocity" })).toBeTruthy();
  });
  it("shows meaningful missing-data states after filters", () => {
    render(
      <MemoryRouter initialEntries={["/movement"]}>
        <App />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    fireEvent.change(screen.getByLabelText("Minimum velocity (mph)"), {
      target: { value: "120" },
    });
    expect(screen.getByText("Movement data not available.")).toBeTruthy();
  });
  it("reconstructs paths and changes view", () => {
    render(
      <MemoryRouter initialEntries={["/tunneling"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("img", { name: "Reconstructed pitch flight paths" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Top" }));
    expect(screen.getByText("TOP VIEW")).toBeTruthy();
  });
  it("imports multiple pitchers and dates after mapping and unit confirmation", async () => {
    let imported: Session[] = [];
    const { container } = render(
      <Upload
        onClose={() => {}}
        onImport={(s) => {
          imported = s;
        }}
      />,
    );
    const file = new File([""], "bullpen.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", {
      value: async () =>
        "Pitcher,TaggedPitchType,RelSpeed,Date\nAlex,Fastball,92,2026-09-14\nJordan,Slider,84,2026-09-15",
    });
    fireEvent.change(container.querySelector("input[type=file]")!, {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Import 2 pitches" }),
      ).toBeTruthy(),
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Import 2 pitches",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Import 2 pitches" }));
    expect(imported).toHaveLength(2);
    expect(imported[1].pitches[0].pitcherName).toBe("Jordan");
  });
});
