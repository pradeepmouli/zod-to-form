import type { EvaluationError } from "../../types/playground.ts";

const TYPE_LABELS: Record<EvaluationError["type"], string> = {
  syntax: "Syntax Error",
  runtime: "Runtime Error",
  timeout: "Timeout",
  import: "Import Error",
};

const TYPE_COLORS: Record<EvaluationError["type"], string> = {
  syntax: "bg-red-500/20 text-red-400 border-red-500/30",
  runtime: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  timeout: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  import: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

interface ErrorDisplayProps {
  error: EvaluationError;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-950/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded border ${TYPE_COLORS[error.type]}`}
        >
          {TYPE_LABELS[error.type]}
        </span>
        {error.line != null && (
          <span className="text-xs text-zinc-500">
            Line {error.line}
            {error.column != null ? `:${error.column}` : ""}
          </span>
        )}
      </div>
      <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono">
        {error.message}
      </pre>
    </div>
  );
}
