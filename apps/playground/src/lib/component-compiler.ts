import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as LucideIcons from "lucide-react";
import { transform } from "sucrase";

function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]) {
  return twMerge(clsx(inputs));
}

const MODULE_MAP: Record<string, unknown> = {
  "react": React,
  "@radix-ui/react-checkbox": CheckboxPrimitive,
  "@radix-ui/react-switch": SwitchPrimitives,
  "@radix-ui/react-select": SelectPrimitive,
  "@radix-ui/react-label": LabelPrimitive,
  "@radix-ui/react-radio-group": RadioGroupPrimitive,
  "@radix-ui/react-slot": { Slot, __esModule: true },
  "class-variance-authority": { cva, __esModule: true },
  "clsx": { clsx, __esModule: true },
  "tailwind-merge": { twMerge, __esModule: true },
  "lucide-react": LucideIcons,
  "@/lib/utils": { cn, __esModule: true },
};

export interface CompileResult {
  ok: true;
  component: React.ComponentType<Record<string, unknown>>;
  exportName: string;
}

export interface CompileError {
  ok: false;
  error: string;
}

function resolveModule(specifier: string): unknown {
  if (MODULE_MAP[specifier]) {
    return MODULE_MAP[specifier];
  }
  for (const [key, mod] of Object.entries(MODULE_MAP)) {
    if (specifier.startsWith(key + "/")) {
      return mod;
    }
  }
  return null;
}

export function compileComponent(
  name: string,
  source: string,
): CompileResult | CompileError {
  try {
    const jsCode = transform(source, {
      transforms: ["typescript", "jsx", "imports"],
      jsxRuntime: "classic",
      jsxPragma: "React.createElement",
      jsxFragmentPragma: "React.Fragment",
      production: true,
    }).code;

    const importRegex = /require\(["']([^"']+)["']\)/g;
    const requireCalls = [...jsCode.matchAll(importRegex)];

    const missingDeps: string[] = [];
    for (const match of requireCalls) {
      const specifier = match[1]!;
      if (!resolveModule(specifier)) {
        missingDeps.push(specifier);
      }
    }

    if (missingDeps.length > 0) {
      return {
        ok: false,
        error: `Missing dependencies: ${missingDeps.join(", ")}. These packages are not available in the playground runtime.`,
      };
    }

    const moduleExports: Record<string, unknown> = {};

    const requireFn = (specifier: string): unknown => {
      const mod = resolveModule(specifier);
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
      "window", "globalThis", "self",
      "document", "fetch", "XMLHttpRequest", "WebSocket", "EventSource",
      "localStorage", "sessionStorage", "indexedDB",
      "navigator", "location", "history",
      "Worker", "SharedWorker", "ServiceWorker",
      "importScripts",
    ];
    const globalShadowParams = SHADOWED_GLOBALS.join(", ");
    const globalShadowArgs = SHADOWED_GLOBALS.map(() => "undefined").join(", ");

    const sandboxedCode = `(function(${globalShadowParams}) {
${wrappedCode}
})(${globalShadowArgs});`;

    const fn = new Function("require", "React", "__exports__", sandboxedCode);
    fn(requireFn, React, moduleExports);

    const exportName =
      name
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("") || name;

    let component: React.ComponentType<Record<string, unknown>> | null = null;

    if (typeof moduleExports[exportName] === "function" || isForwardRef(moduleExports[exportName])) {
      component = moduleExports[exportName] as React.ComponentType<Record<string, unknown>>;
    } else {
      for (const [key, val] of Object.entries(moduleExports)) {
        if (key.startsWith("_")) continue;
        if (typeof val === "function" || isForwardRef(val)) {
          component = val as React.ComponentType<Record<string, unknown>>;
          break;
        }
      }
    }

    if (!component) {
      return {
        ok: false,
        error: `No React component export found in "${name}". Expected a named export like "${exportName}".`,
      };
    }

    return { ok: true, component, exportName };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown compilation error";
    return { ok: false, error: message };
  }
}

function isForwardRef(value: unknown): boolean {
  return (
    !!value &&
    typeof value === "object" &&
    "$$typeof" in value &&
    typeof (value as Record<string, unknown>).$$typeof === "symbol"
  );
}

export function compileComponents(
  sources: Record<string, string>,
): {
  components: Record<string, React.ComponentType<Record<string, unknown>>>;
  errors: Record<string, string>;
} {
  const components: Record<string, React.ComponentType<Record<string, unknown>>> = {};
  const errors: Record<string, string> = {};

  for (const [name, source] of Object.entries(sources)) {
    const result = compileComponent(name, source);
    if (result.ok) {
      components[result.exportName] = result.component;
    } else {
      errors[name] = result.error;
    }
  }

  return { components, errors };
}
