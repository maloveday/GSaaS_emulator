/**
 * App.test.js
 *
 * Basic integration test to verify routing and key elements for each page in the GSaaS Emulator.
 * Uses React Testing Library and Jest.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

describe("GSaaS Emulator App", () => {
  test("renders navigation links", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/Manage Satellites/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage Ground Stations/i)).toBeInTheDocument();
    expect(screen.getByText(/Assign Satellite/i)).toBeInTheDocument();
    expect(screen.getByText(/Assignment Overview/i)).toBeInTheDocument();
  });

  test("navigates to Manage Satellites page", () => {
    render(
      <MemoryRouter initialEntries={["/satellites"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText("Manage Satellites")).toBeInTheDocument();
  });

  test("navigates to Manage Ground Stations page", () => {
    render(
      <MemoryRouter initialEntries={["/groundstations"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText("Manage Ground Stations")).toBeInTheDocument();
  });

  test("navigates to Assign Satellite page", () => {
    render(
      <MemoryRouter initialEntries={["/assign"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText("Assign Satellite to Ground Stations")).toBeInTheDocument();
  });

  test("navigates to Assignment Overview page", () => {
    render(
      <MemoryRouter initialEntries={["/overview"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText("Assignment Overview")).toBeInTheDocument();
  });
});