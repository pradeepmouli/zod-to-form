import { useState } from "react";
import type { FormField } from "@zod-to-form/core";

interface IRInspectorProps {
  fields: FormField[] | null;
}

function FieldNode({ field, depth }: { field: FormField; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = field.children && field.children.length > 0;
  const indent = depth * 16;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left flex items-center gap-1 py-1 hover:bg-zinc-800/50 rounded px-1"
        style={{ paddingLeft: indent }}
        aria-expanded={expanded}
      >
        {hasChildren && (
          <span className="text-zinc-500 text-xs w-4 text-center">
            {expanded ? "▼" : "▶"}
          </span>
        )}
        {!hasChildren && <span className="w-4" />}

        <span className="text-violet-400 text-sm font-mono">{field.key}</span>
        <span className="text-zinc-600 text-xs ml-1">{field.component}</span>

        {field.required && (
          <span className="text-red-400 text-xs ml-1">*</span>
        )}
        {field.label && field.label !== field.key && (
          <span className="text-zinc-500 text-xs ml-2 truncate">
            "{field.label}"
          </span>
        )}
      </button>

      {expanded && (
        <div>
          <div
            className="text-xs text-zinc-500 space-y-0.5 py-1"
            style={{ paddingLeft: indent + 20 }}
          >
            {field.description && (
              <div>
                desc: <span className="text-zinc-400">{field.description}</span>
              </div>
            )}
            {field.placeholder && (
              <div>
                placeholder:{" "}
                <span className="text-zinc-400">{field.placeholder}</span>
              </div>
            )}
            {field.defaultValue !== undefined && (
              <div>
                default:{" "}
                <span className="text-zinc-400">
                  {JSON.stringify(field.defaultValue)}
                </span>
              </div>
            )}
            {field.constraints && Object.keys(field.constraints).length > 0 && (
              <div>
                constraints:{" "}
                <span className="text-zinc-400">
                  {JSON.stringify(field.constraints)}
                </span>
              </div>
            )}
            {field.options && field.options.length > 0 && (
              <div>
                options:{" "}
                <span className="text-zinc-400">
                  [{field.options.map((o) => `"${o.label}"`).join(", ")}]
                </span>
              </div>
            )}
          </div>

          {hasChildren &&
            field.children!.map((child) => (
              <FieldNode key={child.key} field={child} depth={depth + 1} />
            ))}
        </div>
      )}
    </div>
  );
}

export function IRInspector({ fields }: IRInspectorProps) {
  const [viewMode, setViewMode] = useState<"tree" | "json">("tree");

  if (!fields || fields.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
        No fields to inspect
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-xs text-zinc-500">
          {fields.length} field{fields.length !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("tree")}
            className={`text-xs px-2 py-0.5 rounded ${viewMode === "tree" ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Tree
          </button>
          <button
            onClick={() => setViewMode("json")}
            className={`text-xs px-2 py-0.5 rounded ${viewMode === "json" ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            JSON
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {viewMode === "tree" ? (
          <div>
            {fields.map((field) => (
              <FieldNode key={field.key} field={field} depth={0} />
            ))}
          </div>
        ) : (
          <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap p-2">
            {JSON.stringify(
              fields,
              (key, value) => {
                if (key === "render" && typeof value === "function")
                  return "[Function]";
                return value;
              },
              2,
            )}
          </pre>
        )}
      </div>
    </div>
  );
}
