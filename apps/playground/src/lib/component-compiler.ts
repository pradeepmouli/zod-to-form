import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as LucideIcons from 'lucide-react';
import { transform } from 'sucrase';

function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]) {
  return twMerge(clsx(inputs));
}

// The unified `radix-ui` package re-exports all primitives under their
// component names. Assemble a matching namespace so components that
// `import { Checkbox } from "radix-ui"` resolve correctly.
const RadixUnified = {
  Checkbox: CheckboxPrimitive,
  Switch: SwitchPrimitives,
  Select: SelectPrimitive,
  Label: LabelPrimitive,
  RadioGroup: RadioGroupPrimitive,
  Slot,
  __esModule: true
};

const MODULE_MAP: Record<string, unknown> = {
  react: React,
  'radix-ui': RadixUnified,
  '@radix-ui/react-checkbox': CheckboxPrimitive,
  '@radix-ui/react-switch': SwitchPrimitives,
  '@radix-ui/react-select': SelectPrimitive,
  '@radix-ui/react-label': LabelPrimitive,
  '@radix-ui/react-radio-group': RadioGroupPrimitive,
  '@radix-ui/react-slot': { Slot, __esModule: true },
  'class-variance-authority': { cva, __esModule: true },
  clsx: { clsx, __esModule: true },
  'tailwind-merge': { twMerge, __esModule: true },
  'lucide-react': LucideIcons,
  '@/lib/utils': { cn, __esModule: true }
};

export interface CompileResult {
  ok: true;
  component: React.ComponentType<Record<string, unknown>>;
  exportName: string;
  moduleExports: Record<string, unknown>;
}

export interface CompileError {
  ok: false;
  error: string;
}

const COMPONENT_MAP_SLOTS = [
  'Input',
  'Textarea',
  'Select',
  'Checkbox',
  'Switch',
  'DatePicker',
  'FileInput',
  'RadioGroup',
  'Combobox',
  'Field',
  'FieldLabel',
  'FieldDescription',
  'FieldMessage'
];

const NAME_TO_SLOT: Record<string, string> = {};
for (const slot of COMPONENT_MAP_SLOTS) {
  NAME_TO_SLOT[slot.toLowerCase()] = slot;
}

function resolveComponentSlotName(registryName: string): string {
  const normalized = registryName
    .replace(/^8bit-/, '')
    .replace(/^retro-/, '')
    .replace(/^brutal-/, '')
    .replace(/^neo-/, '')
    .replace(/-/g, '');
  if (NAME_TO_SLOT[normalized]) {
    return NAME_TO_SLOT[normalized];
  }
  return registryName
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

const CSS_STUB = { __esModule: true };

function resolveModule(
  specifier: string,
  runtimeModules?: Record<string, Record<string, unknown>>
): unknown {
  if (specifier.endsWith('.css')) {
    return CSS_STUB;
  }

  if (MODULE_MAP[specifier]) {
    return MODULE_MAP[specifier];
  }

  for (const [key, mod] of Object.entries(MODULE_MAP)) {
    if (specifier.startsWith(key + '/')) {
      return mod;
    }
  }

  if (runtimeModules) {
    if (runtimeModules[specifier]) {
      return runtimeModules[specifier];
    }

    const aliased = specifier
      .replace(/^@\/components\//, '')
      .replace(/^@\//, '')
      .replace(/^\.\//, '');
    if (runtimeModules[aliased]) {
      return runtimeModules[aliased];
    }

    if (specifier.startsWith('@/components/ui/')) {
      const uiPath = 'ui/' + specifier.slice('@/components/ui/'.length);
      if (runtimeModules[uiPath]) {
        return runtimeModules[uiPath];
      }
    }

    for (const [key, mod] of Object.entries(runtimeModules)) {
      const keyBase = key.split('/').pop()!;
      const specBase = specifier.split('/').pop()!;
      if (keyBase === specBase && key.includes('ui/')) {
        return mod;
      }
    }
  }

  return null;
}

export function compileComponent(
  name: string,
  source: string,
  runtimeModules?: Record<string, Record<string, unknown>>
): CompileResult | CompileError {
  try {
    const jsCode = transform(source, {
      transforms: ['typescript', 'jsx', 'imports'],
      jsxRuntime: 'classic',
      jsxPragma: 'React.createElement',
      jsxFragmentPragma: 'React.Fragment',
      production: true
    }).code;

    const importRegex = /require\(["']([^"']+)["']\)/g;
    const requireCalls = [...jsCode.matchAll(importRegex)];

    const missingDeps: string[] = [];
    for (const match of requireCalls) {
      const specifier = match[1]!;
      if (!resolveModule(specifier, runtimeModules)) {
        missingDeps.push(specifier);
      }
    }

    if (missingDeps.length > 0) {
      return {
        ok: false,
        error: `Missing dependencies: ${missingDeps.join(', ')}. These packages are not available in the playground runtime.`
      };
    }

    const moduleExports: Record<string, unknown> = {};

    const requireFn = (specifier: string): unknown => {
      const mod = resolveModule(specifier, runtimeModules);
      if (!mod) {
        throw new Error(`Module not found: ${specifier}`);
      }
      return mod;
    };

    const wrappedCode = `"use strict";
var exports = __exports__;
var module = { exports: __exports__ };
${jsCode}
if (module.exports !== __exports__) {
  Object.assign(__exports__, module.exports);
}`;

    const SHADOWED_GLOBALS = [
      'window',
      'globalThis',
      'self',
      'document',
      'fetch',
      'XMLHttpRequest',
      'WebSocket',
      'EventSource',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'navigator',
      'location',
      'history',
      'Worker',
      'SharedWorker',
      'ServiceWorker',
      'importScripts'
    ];
    const globalShadowParams = SHADOWED_GLOBALS.join(', ');
    const globalShadowArgs = SHADOWED_GLOBALS.map(() => 'undefined').join(', ');

    const sandboxedCode = `(function(${globalShadowParams}) {
${wrappedCode}
})(${globalShadowArgs});`;

    const fn = new Function('require', 'React', '__exports__', sandboxedCode);
    fn(requireFn, React, moduleExports);

    const composed = tryComposeRadixComponent(name, moduleExports);
    if (composed) {
      return {
        ok: true,
        component: composed.component,
        exportName: composed.exportName,
        moduleExports
      };
    }

    const slotName = resolveComponentSlotName(name);

    let component: React.ComponentType<Record<string, unknown>> | null = null;
    let resolvedExportName = slotName;

    if (
      slotName &&
      (typeof moduleExports[slotName] === 'function' || isForwardRef(moduleExports[slotName]))
    ) {
      component = moduleExports[slotName] as React.ComponentType<Record<string, unknown>>;
      resolvedExportName = slotName;
    } else {
      for (const [key, val] of Object.entries(moduleExports)) {
        if (key.startsWith('_')) continue;
        if (typeof val === 'function' || isForwardRef(val)) {
          component = val as React.ComponentType<Record<string, unknown>>;
          resolvedExportName = COMPONENT_MAP_SLOTS.includes(key) ? key : (slotName ?? key);
          break;
        }
      }
    }

    if (!component) {
      return {
        ok: false,
        error: `No React component export found in "${name}".`
      };
    }

    return { ok: true, component, exportName: resolvedExportName, moduleExports };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown compilation error';
    return { ok: false, error: message };
  }
}

type AnyComponent = React.ComponentType<Record<string, unknown>>;

interface ComposedResult {
  component: AnyComponent;
  exportName: string;
}

function isComponent(value: unknown): boolean {
  return typeof value === 'function' || isForwardRef(value);
}

function tryComposeRadixComponent(
  name: string,
  exports: Record<string, unknown>
): ComposedResult | null {
  if (name === 'select') {
    return tryComposeSelect(exports);
  }
  if (name === 'checkbox') {
    return tryComposeCheckbox(exports);
  }
  if (name === 'switch') {
    return tryComposeSwitch(exports);
  }
  return null;
}

function tryComposeSelect(exports: Record<string, unknown>): ComposedResult | null {
  const SelectRoot = exports['Select'];
  const Trigger = exports['SelectTrigger'];
  const Value = exports['SelectValue'];
  const Content = exports['SelectContent'];
  const Item = exports['SelectItem'];

  if (
    !isComponent(SelectRoot) ||
    !isComponent(Trigger) ||
    !isComponent(Content) ||
    !isComponent(Item)
  ) {
    return null;
  }

  const S = SelectRoot as AnyComponent;
  const T = Trigger as AnyComponent;
  const V = (Value ?? (() => null)) as AnyComponent;
  const C = Content as AnyComponent;
  const I = Item as AnyComponent;

  const ComposedSelect = React.forwardRef<unknown, Record<string, unknown>>(
    function ComposedSelect(props, ref) {
      const {
        options,
        value,
        onValueChange,
        onChange,
        onBlur,
        placeholder,
        disabled,
        required,
        id,
        name: fieldName,
        className,
        ...rest
      } = props as {
        options?: { value: string | number; label: string; disabled?: boolean }[];
        value?: string;
        onValueChange?: (v: string) => void;
        onChange?: (v: string) => void;
        onBlur?: () => void;
        placeholder?: string;
        disabled?: boolean;
        required?: boolean;
        id?: string;
        name?: string;
        className?: string;
        [k: string]: unknown;
      };

      const handleChange = onValueChange ?? onChange;

      return React.createElement(
        S,
        { value: value ?? '', onValueChange: handleChange, ...rest },
        React.createElement(
          T,
          { ref, className, id, disabled, onBlur, 'aria-required': required },
          React.createElement(V, { placeholder: placeholder ?? 'Select...' })
        ),
        React.createElement(
          C,
          null,
          ...(options ?? []).map((opt) =>
            React.createElement(
              I,
              {
                key: `${opt.value}`,
                value: `${opt.value}`,
                disabled: opt.disabled
              },
              opt.label
            )
          )
        )
      );
    }
  );

  return { component: ComposedSelect as AnyComponent, exportName: 'Select' };
}

function tryComposeCheckbox(exports: Record<string, unknown>): ComposedResult | null {
  const Checkbox = exports['Checkbox'];
  if (!isComponent(Checkbox)) return null;
  return { component: Checkbox as AnyComponent, exportName: 'Checkbox' };
}

function tryComposeSwitch(exports: Record<string, unknown>): ComposedResult | null {
  const Switch = exports['Switch'];
  if (!isComponent(Switch)) return null;
  return { component: Switch as AnyComponent, exportName: 'Switch' };
}

function isForwardRef(value: unknown): boolean {
  return (
    !!value &&
    typeof value === 'object' &&
    '$$typeof' in value &&
    typeof (value as Record<string, unknown>).$$typeof === 'symbol'
  );
}

export function compileComponents(sources: Record<string, string>): {
  components: Record<string, React.ComponentType<Record<string, unknown>>>;
  errors: Record<string, string>;
} {
  const components: Record<string, React.ComponentType<Record<string, unknown>>> = {};
  const errors: Record<string, string> = {};
  const compiledModules: Record<string, Record<string, unknown>> = {};

  const compiled = new Set<string>();
  const remaining = new Set(Object.keys(sources));

  let maxPasses = remaining.size + 1;
  while (remaining.size > 0 && maxPasses-- > 0) {
    let progress = false;
    for (const name of [...remaining]) {
      const source = sources[name]!;
      const result = compileComponent(name, source, compiledModules);
      if (result.ok) {
        components[result.exportName] = result.component;
        const mod = result.moduleExports ?? {
          [result.exportName]: result.component,
          __esModule: true
        };
        compiledModules[name] = mod;

        const baseName = name.split('/').pop()!;
        if (baseName !== name && !compiledModules[baseName]) {
          compiledModules[baseName] = mod;
        }

        compiled.add(name);
        remaining.delete(name);
        progress = true;
      } else if (!result.error.startsWith('Missing dependencies:')) {
        errors[name] = result.error;
        remaining.delete(name);
        progress = true;
      }
    }
    if (!progress) break;
  }

  for (const name of remaining) {
    const result = compileComponent(name, sources[name]!, compiledModules);
    if (result.ok) {
      components[result.exportName] = result.component;
    } else {
      errors[name] = result.error;
    }
  }

  return { components, errors };
}
