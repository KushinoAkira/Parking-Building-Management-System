import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { isPlateRecognizerConfigured } from "./plateRecognizer";

describe("plateRecognizer", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_PLATE_RECOGNIZER_TOKEN", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when token missing or placeholder", () => {
    expect(isPlateRecognizerConfigured()).toBe(false);
    vi.stubEnv("VITE_PLATE_RECOGNIZER_TOKEN", "your_free_token_here");
    expect(isPlateRecognizerConfigured()).toBe(false);
  });

  it("returns true when real token configured", () => {
    vi.stubEnv("VITE_PLATE_RECOGNIZER_TOKEN", "abc123real");
    expect(isPlateRecognizerConfigured()).toBe(true);
  });
});
