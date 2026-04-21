import {
  createElement,
  useEffect,
  useState,
  useMemo,
  type ComponentType,
  type ReactNode
} from 'react';
import { fetchShadcnSources } from '../lib/shadcn-registry.js';
import { compileComponents } from '../lib/component-compiler.js';

/**
 * Wrap the fetched shadcn Button as an ArrayAddButton: applies outline variant
 * and sm size, sets type="button" defensively, default label "+ Add".
 */
// Tight inline-row button sizing. shadcn's built-in `sm` is 32px tall which
// feels oversized in array rows — override via className to get ~24px height.
const COMPACT_BUTTON_CLASS = 'h-7 px-2 text-xs gap-1';

function wrapAsArrayAddButton(
  Button: ComponentType<Record<string, unknown>>
): ComponentType<Record<string, unknown>> {
  return function ShadcnArrayAddButton(props: Record<string, unknown>) {
    const { children, className, ...rest } = props;
    const mergedClassName = [COMPACT_BUTTON_CLASS, className].filter(Boolean).join(' ');
    return createElement(
      Button as ComponentType<Record<string, unknown>>,
      { variant: 'outline', size: 'sm', ...rest, className: mergedClassName, type: 'button' },
      (children ?? '+ Add') as ReactNode
    );
  };
}

/**
 * Wrap the fetched shadcn Button as an ArrayRemoveButton: ghost variant, tight
 * size, red-tinted destructive hover for clearer remove affordance.
 */
function wrapAsArrayRemoveButton(
  Button: ComponentType<Record<string, unknown>>
): ComponentType<Record<string, unknown>> {
  return function ShadcnArrayRemoveButton(props: Record<string, unknown>) {
    const { children, className, ...rest } = props;
    const mergedClassName = [COMPACT_BUTTON_CLASS, 'hover:text-destructive', className]
      .filter(Boolean)
      .join(' ');
    return createElement(
      Button as ComponentType<Record<string, unknown>>,
      { variant: 'ghost', size: 'sm', ...rest, className: mergedClassName, type: 'button' },
      (children ?? '− Remove') as ReactNode
    );
  };
}

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
    const result = compileComponents(sources);

    // If the Button component was fetched and compiled, wire it into the
    // array add/remove slots so array/set/map fields get real shadcn Buttons.
    const Button = result.components['Button'];
    if (Button) {
      result.components['ArrayAddButton'] = wrapAsArrayAddButton(Button);
      result.components['ArrayRemoveButton'] = wrapAsArrayRemoveButton(Button);
    }

    return result;
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
