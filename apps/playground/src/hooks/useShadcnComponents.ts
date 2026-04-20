import { useEffect, useState, useMemo, type ComponentType } from 'react';
import { fetchShadcnSources } from '../lib/shadcn-registry.js';
import { compileComponents } from '../lib/component-compiler.js';

interface ShadcnComponentsState {
  /** Compiled shadcn components ready to pass into the form preview */
  components: Record<string, ComponentType<Record<string, unknown>>>;
  /** Whether the fetch+compile is in progress */
  loading: boolean;
  /** Any errors during fetch or compilation */
  errors: string[];
}

/**
 * Fetches and compiles real shadcn/ui components from the public registry.
 * Only activates when `enabled` is true (i.e., shadcn preset is selected).
 * Results are cached in localStorage for 24h.
 */
export function useShadcnComponents(enabled: boolean): ShadcnComponentsState {
  const [sources, setSources] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchErrors, setFetchErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) {
      setSources(null);
      setFetchErrors([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchShadcnSources().then((result) => {
      if (cancelled) return;
      setSources(result.sources);
      setFetchErrors(result.errors);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const compiled = useMemo(() => {
    if (!sources || Object.keys(sources).length === 0) {
      return { components: {}, errors: {} };
    }
    return compileComponents(sources);
  }, [sources]);

  const errors = useMemo(() => {
    const all = [...fetchErrors];
    for (const [name, err] of Object.entries(compiled.errors)) {
      all.push(`${name}: ${err}`);
    }
    return all;
  }, [fetchErrors, compiled.errors]);

  return {
    components: compiled.components,
    loading,
    errors
  };
}
