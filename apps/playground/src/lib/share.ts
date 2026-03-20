import LZString from "lz-string";
import type { ShareState, ComponentMapType, ActiveTab } from "../types/playground.ts";

const WARN_THRESHOLD = 2000;

export function encodeShareState(state: ShareState): string {
  const compressed = LZString.compressToEncodedURIComponent(state.code);
  const parts = [`code=${compressed}`];
  if (state.map && state.map !== "default") parts.push(`map=${state.map}`);
  if (state.tab && state.tab !== "preview") parts.push(`tab=${state.tab}`);
  const hash = `#${parts.join("&")}`;
  if (hash.length > WARN_THRESHOLD) {
    console.warn(
      `Share URL is ${hash.length} chars — some browsers/services may truncate it.`,
    );
  }
  return hash;
}

export function decodeShareState(hash: string): ShareState | null {
  try {
    const clean = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!clean) return null;
    const params = new URLSearchParams(clean);
    const codeCompressed = params.get("code");
    if (!codeCompressed) return null;
    const code = LZString.decompressFromEncodedURIComponent(codeCompressed);
    if (!code) return null;
    const mapParam = params.get("map");
    const tabParam = params.get("tab");
    return {
      code,
      map: (mapParam === "shadcn" ? "shadcn" : "default") as ComponentMapType,
      tab: (tabParam === "inspect" || tabParam === "code"
        ? tabParam
        : "preview") as ActiveTab,
    };
  } catch {
    return null;
  }
}
