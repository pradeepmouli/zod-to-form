import type { EvaluationError } from '../../types/playground.ts';

const TYPE_LABELS: Record<EvaluationError['type'], string> = {
  syntax: 'Syntax Error',
  runtime: 'Runtime Error',
  timeout: 'Timeout',
  import: 'Import Error'
};

const TYPE_COLORS: Record<EvaluationError['type'], string> = {
  syntax: 'bg-red-500/15 text-red-400 border-red-500/25',
  runtime: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  timeout: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  import: 'bg-purple-500/15 text-purple-400 border-purple-500/25'
};

interface ErrorDisplayProps {
  error: EvaluationError;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div
      className="glass-panel p-4"
      style={{
        background: 'rgba(239, 68, 68, 0.06)',
        border: '1px solid rgba(239, 68, 68, 0.15)'
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-md border ${TYPE_COLORS[error.type]}`}
        >
          {TYPE_LABELS[error.type]}
        </span>
        {error.line != null && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Line {error.line}
            {error.column != null ? `:${error.column}` : ''}
          </span>
        )}
      </div>
      <pre
        className="text-sm text-red-300 whitespace-pre-wrap"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {error.message}
      </pre>
    </div>
  );
}
