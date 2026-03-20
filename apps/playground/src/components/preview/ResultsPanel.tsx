import type { SubmitResult } from "../../types/playground.ts";

interface ResultsPanelProps {
  result: SubmitResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className="p-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
      <h3
        className="text-sm font-medium mb-2"
        style={{ color: "var(--text-secondary)" }}
      >
        Submit Result
      </h3>
      {result.success ? (
        <div
          className="rounded-lg p-3"
          style={{
            background: "rgba(34, 197, 94, 0.08)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
          }}
        >
          <span className="text-xs font-medium text-green-400 mb-1 block">
            Validation Passed
          </span>
          <pre
            className="text-sm whitespace-pre-wrap"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
          >
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      ) : (
        <div
          className="rounded-lg p-3"
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          <span className="text-xs font-medium text-red-400 mb-1 block">
            Validation Failed
          </span>
          <ul className="text-sm text-red-300 space-y-1">
            {result.errors?.map((err, i) => (
              <li key={i} style={{ fontFamily: "var(--font-mono)" }}>
                <span style={{ color: "var(--text-muted)" }}>{err.path}:</span>{" "}
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
