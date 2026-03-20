import type { SubmitResult } from "../../types/playground.ts";

interface ResultsPanelProps {
  result: SubmitResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className="border-t border-zinc-800 p-4">
      <h3 className="text-sm font-medium text-zinc-400 mb-2">
        Submit Result
      </h3>
      {result.success ? (
        <div className="rounded-lg border border-green-500/20 bg-green-950/30 p-3">
          <span className="text-xs font-medium text-green-400 mb-1 block">
            Validation Passed
          </span>
          <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="rounded-lg border border-red-500/20 bg-red-950/30 p-3">
          <span className="text-xs font-medium text-red-400 mb-1 block">
            Validation Failed
          </span>
          <ul className="text-sm text-red-300 space-y-1">
            {result.errors?.map((err, i) => (
              <li key={i} className="font-mono">
                <span className="text-zinc-500">{err.path}:</span> {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
