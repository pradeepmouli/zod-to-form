import { useMemo, useState, useCallback } from "react";
import type { FormField } from "@zod-to-form/core";
import { generateFormCode } from "../../lib/codegen.ts";

interface CodeOutputProps {
  fields: FormField[] | null;
  editorContent: string;
}

export function CodeOutput({ fields }: CodeOutputProps) {
  const [copied, setCopied] = useState(false);

  const generatedCode = useMemo(() => {
    if (!fields || fields.length === 0) return null;
    try {
      return generateFormCode(fields);
    } catch {
      return null;
    }
  }, [fields]);

  const handleCopy = useCallback(() => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [generatedCode]);

  if (!generatedCode) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
        <span className="text-sm">Write a valid schema to see generated code</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Generated React + React Hook Form component
        </span>
        <button
          onClick={handleCopy}
          className="btn-glass text-xs px-3 py-1"
          style={
            copied
              ? { color: 'var(--accent-violet)', borderColor: 'var(--border-glow)' }
              : undefined
          }
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre
          className="text-sm whitespace-pre-wrap leading-relaxed"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
        >
          <code>{generatedCode}</code>
        </pre>
      </div>
    </div>
  );
}
