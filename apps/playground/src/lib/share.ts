import LZString from 'lz-string';
import { z } from 'zod';
import type { ShareState } from '../types/playground.ts';

const WARN_THRESHOLD = 2000;

/** Zod schema for validating decoded share state (dogfooding) */
const ShareStateSchema = z.object({
  code: z.string().min(1),
  map: z.enum(['default', 'shadcn']).optional(),
  tab: z.enum(['preview', 'inspect', 'code']).optional()
});

export interface EncodeResult {
  hash: string;
  /** True when the compressed URL exceeds a safe length for sharing */
  tooLarge: boolean;
}

export function encodeShareState(state: ShareState): EncodeResult {
  const compressed = LZString.compressToEncodedURIComponent(state.code);
  const parts = [`code=${compressed}`];
  if (state.map && state.map !== 'default') parts.push(`map=${state.map}`);
  if (state.tab && state.tab !== 'preview') parts.push(`tab=${state.tab}`);
  const hash = `#${parts.join('&')}`;
  const tooLarge = hash.length > WARN_THRESHOLD;
  if (tooLarge) {
    console.warn(`Share URL is ${hash.length} chars — some browsers/services may truncate it.`);
  }
  return { hash, tooLarge };
}

export function decodeShareState(hash: string): ShareState | null {
  try {
    const clean = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!clean) return null;
    const params = new URLSearchParams(clean);
    const codeCompressed = params.get('code');
    if (!codeCompressed) return null;
    const code = LZString.decompressFromEncodedURIComponent(codeCompressed);
    if (!code) return null;
    const mapParam = params.get('map');
    const tabParam = params.get('tab');
    const raw = {
      code,
      map: mapParam === 'shadcn' ? 'shadcn' : 'default',
      tab: tabParam === 'inspect' || tabParam === 'code' ? tabParam : 'preview'
    };
    const result = ShareStateSchema.safeParse(raw);
    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}
