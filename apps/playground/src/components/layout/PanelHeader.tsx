import type { ReactNode } from 'react';

type PanelAccent = 'teal' | 'pink' | 'none';

interface PanelHeaderProps {
  /** Short uppercase label — "Schema", "Config", "Preview", etc. */
  label: string;
  /** Small color dot next to the label. Teal = input, pink = output. */
  accent?: PanelAccent;
  /** Optional secondary caption (muted, rendered inline after the label). */
  caption?: ReactNode;
  /** Slot for trailing controls (buttons, tabs, etc.). */
  children?: ReactNode;
}

/**
 * Small monospace label bar that sits at the top of each playground quadrant.
 * Developer-tool aesthetic — think Linear / Vercel / Railway section headers.
 */
export function PanelHeader({ label, accent = 'none', caption, children }: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <div className="flex items-center gap-2 min-w-0">
        <span className="panel-header__label">
          {accent !== 'none' && (
            <span className={`panel-header__dot panel-header__dot--${accent}`} />
          )}
          {label}
        </span>
        {caption && (
          <span
            className="text-xs truncate"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
          >
            {caption}
          </span>
        )}
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  );
}
