import { ThemeProvider, createTheme } from "@mui/material";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingOverlay } from "../components/layout/onboarding-overlay";

const mockNavigate = vi.fn();

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const theme = createTheme();

function renderOverlay() {
  return render(
    <ThemeProvider theme={theme}>
      <OnboardingOverlay />
    </ThemeProvider>,
  );
}

describe("OnboardingOverlay", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows on first launch", () => {
    renderOverlay();
    expect(screen.getByText("account.brand.name")).toBeInTheDocument();
    expect(screen.getByText("home.onboarding.step1")).toBeInTheDocument();
    expect(screen.getByText("home.onboarding.step2")).toBeInTheDocument();
    expect(screen.getByText("home.onboarding.step3")).toBeInTheDocument();
  });

  it("does not show if already completed", () => {
    localStorage.setItem("onboarding_completed", "true");
    renderOverlay();
    expect(screen.queryByText("account.brand.name")).not.toBeInTheDocument();
  });

  it("clicking Get Started marks complete and navigates", () => {
    renderOverlay();
    fireEvent.click(screen.getByText("home.onboarding.getStarted"));

    expect(localStorage.getItem("onboarding_completed")).toBe("true");
    expect(mockNavigate).toHaveBeenCalledWith("/account");
  });

  it("clicking Skip marks complete without navigating", () => {
    renderOverlay();
    fireEvent.click(screen.getByText("home.onboarding.skip"));

    expect(localStorage.getItem("onboarding_completed")).toBe("true");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows 3 step indicators", () => {
    renderOverlay();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
