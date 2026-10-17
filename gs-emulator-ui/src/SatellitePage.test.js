/**
 * SatellitePage.test.js
 *
 * Tests for SatellitePage using mocked backend API with Mock Service Worker (msw).
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import SatellitePage from "./SatellitePage";
import React from "react";

const API_BASE_URL = "http://localhost:5000";

const server = setupServer(
  rest.get(`${API_BASE_URL}/satellites`, (req, res, ctx) => {
    return res(
      ctx.json([
        { satellite_id: "sat-001", name: "TestSat", telemetry_payload: { temperature: 20 } }
      ])
    );
  }),

  rest.post(`${API_BASE_URL}/satellites`, (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ message: "Satellite created" }));
  }),

  rest.delete(`${API_BASE_URL}/satellites/:id`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: "Satellite deleted" }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("SatellitePage Component", () => {
  test("displays fetched satellite list", async () => {
    render(<SatellitePage />);

    expect(await screen.findByText("TestSat")).toBeInTheDocument();
    expect(screen.getByText("sat-001")).toBeInTheDocument();
  });

  test("creates a new satellite", async () => {
    render(<SatellitePage />);

    fireEvent.change(screen.getByPlaceholderText("Satellite ID"), {
      target: { value: "sat-002" },
    });
    fireEvent.change(screen.getByPlaceholderText("Satellite Name"), {
      target: { value: "DemoSat" },
    });

    fireEvent.click(screen.getByText("Create Satellite"));

    await waitFor(() => {
      expect(screen.getByDisplayValue("")).toBeInTheDocument(); // form clears
    });
  });
});