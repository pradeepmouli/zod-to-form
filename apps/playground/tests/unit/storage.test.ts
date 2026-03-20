/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  savePlaygroundState,
  loadPlaygroundState,
} from "../../src/lib/storage.ts";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it("saves and loads state round-trip", () => {
    const state = {
      editorContent: "z.string();",
      componentMap: "default" as const,
      activeTab: "preview" as const,
      config: null,
      version: 1,
    };
    savePlaygroundState(state);
    vi.advanceTimersByTime(600);
    const loaded = loadPlaygroundState();
    expect(loaded).not.toBeNull();
    expect(loaded!.editorContent).toBe("z.string();");
    expect(loaded!.version).toBe(1);
  });

  it("returns null on corrupt JSON", () => {
    localStorage.setItem("z2f-playground-state", "not-json");
    const loaded = loadPlaygroundState();
    expect(loaded).toBeNull();
  });

  it("returns null when missing required fields", () => {
    localStorage.setItem(
      "z2f-playground-state",
      JSON.stringify({ foo: "bar" }),
    );
    const loaded = loadPlaygroundState();
    expect(loaded).toBeNull();
  });

  it("returns null when localStorage is empty", () => {
    const loaded = loadPlaygroundState();
    expect(loaded).toBeNull();
  });

  it("preserves componentMap value", () => {
    savePlaygroundState({
      editorContent: "test",
      componentMap: "shadcn",
      activeTab: "inspect",
      config: null,
      version: 1,
    });
    vi.advanceTimersByTime(600);
    const loaded = loadPlaygroundState();
    expect(loaded!.componentMap).toBe("shadcn");
    expect(loaded!.activeTab).toBe("inspect");
  });
});
