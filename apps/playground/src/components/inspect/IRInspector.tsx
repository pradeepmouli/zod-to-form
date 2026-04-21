import { useState } from 'react';
import type { FormField } from '@zod-to-form/core';

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
        className="w-full text-left flex items-center gap-1 py-1.5 rounded-md px-1.5 transition-all"
        style={{ paddingLeft: indent }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        aria-expanded={expanded}
      >
        {hasChildren && (
          <span className="text-xs w-4 text-center" style={{ color: 'var(--text-muted)' }}>
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="w-4" />}

        <span
          className="text-sm"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)' }}
        >
          {field.key}
        </span>
        <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
          {field.component}
        </span>

        {field.required && <span className="text-red-400 text-xs ml-1">*</span>}
        {field.label && field.label !== field.key && (
          <span className="text-xs ml-2 truncate" style={{ color: 'var(--text-muted)' }}>
            "{field.label}"
          </span>
        )}
      </button>

      {expanded && (
        <div>
          <div
            className="text-xs space-y-0.5 py-1"
            style={{ paddingLeft: indent + 20, color: 'var(--text-muted)' }}
          >
            {field.description && (
              <div>
                desc: <span style={{ color: 'var(--text-secondary)' }}>{field.description}</span>
              </div>
            )}
            {field.placeholder && (
              <div>
                placeholder:{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{field.placeholder}</span>
              </div>
            )}
            {field.defaultValue !== undefined && (
              <div>
                default:{' '}
                <span style={{ color: 'var(--text-secondary)' }}>
                  {JSON.stringify(field.defaultValue)}
                </span>
              </div>
            )}
            {field.constraints && Object.keys(field.constraints).length > 0 && (
              <div>
                constraints:{' '}
                <span style={{ color: 'var(--text-secondary)' }}>
                  {JSON.stringify(field.constraints)}
                </span>
              </div>
            )}
            {field.options && field.options.length > 0 && (
              <div>
                options:{' '}
                <span style={{ color: 'var(--text-secondary)' }}>
                  [{field.options.map((o) => `"${o.label}"`).join(', ')}]
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
  const [viewMode, setViewMode] = useState<'tree' | 'json'>('tree');

  if (!fields || fields.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        No fields to inspect
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {fields.length} field{fields.length !== 1 ? 's' : ''}
        </span>
        <div
          className="flex gap-1 p-0.5 rounded-md"
          style={{ background: 'rgba(15, 20, 32, 0.5)' }}
        >
          {(['tree', 'json'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="text-xs px-2.5 py-1 rounded-md transition-all"
              style={{
                background: viewMode === mode ? 'var(--accent-teal)' : 'transparent',
                color: viewMode === mode ? '#fff' : 'var(--text-muted)'
              }}
            >
              {mode === 'tree' ? 'Tree' : 'JSON'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {viewMode === 'tree' ? (
          <div>
            {fields.map((field) => (
              <FieldNode key={field.key} field={field} depth={0} />
            ))}
          </div>
        ) : (
          <pre
            className="text-sm whitespace-pre-wrap p-2"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
          >
            {JSON.stringify(
              fields,
              (key, value) => {
                if (key === 'render' && typeof value === 'function') return '[Function]';
                return value;
              },
              2
            )}
          </pre>
        )}
      </div>
    </div>
  );
}
