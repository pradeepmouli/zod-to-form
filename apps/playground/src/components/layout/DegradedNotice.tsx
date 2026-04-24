interface DegradedNoticeProps {
  errors: readonly string[];
}

/**
 * Non-blocking banner shown when shadcn components fail to download.
 * Uses role="status" + aria-live="polite" so screen readers announce it
 * without stealing focus. The rest of the playground (editor, config,
 * code output) stays fully functional.
 */
export function DegradedNotice({ errors }: DegradedNoticeProps) {
  if (errors.length === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="shadcn-degraded-notice"
      style={{
        padding: '0.5rem 1rem',
        background: 'var(--status-warning-bg, rgba(250, 204, 21, 0.1))',
        color: 'var(--status-warning-fg, #fbbf24)',
        borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
        fontSize: '0.75rem',
        lineHeight: 1.4
      }}
    >
      <strong>Shadcn components degraded.</strong> Using built-in fallback components until upstream
      recovers — editor, config, and code output continue to work. ({errors[0]}
      {errors.length > 1 ? ` +${errors.length - 1} more` : ''})
    </div>
  );
}
