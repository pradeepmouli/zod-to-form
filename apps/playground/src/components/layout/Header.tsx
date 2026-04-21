import { useState } from 'react';
import type { ComponentMapType } from '../../types/playground.ts';
import { encodeShareState } from '../../lib/share.ts';

declare const __APP_VERSION__: string;

function shareButtonLabel(failed: boolean, warning: boolean, copied: boolean): string {
  if (failed) return 'Copy failed';
  if (warning) return 'URL may be too long!';
  if (copied) return 'Copied!';
  return 'Share';
}

interface HeaderProps {
  componentMap: ComponentMapType;
  onComponentMapChange: (map: ComponentMapType) => void;
  editorContent: string;
  onExamplesClick: () => void;
  onExportClick: () => void;
  onCustomImportClick: () => void;
  customComponentCount: number;
}

export function Header({
  componentMap,
  onComponentMapChange,
  editorContent,
  onExamplesClick,
  onExportClick,
  onCustomImportClick,
  customComponentCount
}: HeaderProps) {
  const [copied, setCopied] = useState(false);
  const [shareWarning, setShareWarning] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);

  const handleShare = () => {
    const { hash, tooLarge } = encodeShareState({ code: editorContent, map: componentMap });
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        if (tooLarge) {
          setShareWarning(true);
          setTimeout(() => setShareWarning(false), 4000);
        } else {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      })
      .catch((err) => {
        console.warn('[zod-to-form] Clipboard write failed:', err);
        setShareFailed(true);
        setTimeout(() => setShareFailed(false), 2000);
      });
  };

  const shareLabel = shareButtonLabel(shareFailed, shareWarning, copied);

  return (
    <header
      className="glass-surface flex items-center justify-between px-5 py-2.5"
      style={{
        borderBottom: '1px solid var(--border-subtle)'
      }}
      role="banner"
    >
      <div className="flex items-center gap-3">
        <a
          href="/"
          className="flex items-center gap-3 no-underline transition-opacity hover:opacity-80"
          aria-label="Back to zod-to-form homepage"
          title={`zod-to-form Studio — v${__APP_VERSION__}`}
        >
          <img
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt="zod-to-form logo"
            style={{ width: 28, height: 24 }}
          />
          <div className="flex flex-col leading-none">
            <h1
              className="text-lg tracking-tight"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                letterSpacing: '-0.5px',
                margin: 0
              }}
            >
              <span style={{ color: 'var(--accent-teal)' }}>zod</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>-to-</span>
              <span style={{ color: 'var(--accent-pink)' }}>form</span>
            </h1>
            <span
              className="hidden sm:inline"
              style={{
                marginTop: 2,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase'
              }}
            >
              Studio
            </span>
          </div>
        </a>
      </div>

      <nav className="flex items-center gap-2" aria-label="Playground controls">
        <select
          value={componentMap}
          onChange={(e) => onComponentMapChange(e.target.value as ComponentMapType)}
          className="btn-glass text-xs px-2.5 py-1.5 outline-none cursor-pointer"
          aria-label="Form theme"
        >
          <option value="default">Plain HTML</option>
          <option value="shadcn">Styled</option>
        </select>

        <button
          onClick={onExamplesClick}
          className="btn-glass text-xs px-3 py-1.5"
          aria-label="Browse example schemas"
        >
          Examples
        </button>

        <button
          onClick={onExportClick}
          className="btn-glass text-xs px-3 py-1.5"
          aria-label="Export config and components"
        >
          Export
        </button>

        <button
          onClick={onCustomImportClick}
          className="btn-glass text-xs px-3 py-1.5"
          aria-label="Import custom components"
        >
          Components{customComponentCount > 0 ? ` (${customComponentCount})` : ''}
        </button>

        <button
          onClick={handleShare}
          className="btn-accent text-xs px-3 py-1.5"
          aria-label="Copy share URL to clipboard"
        >
          {shareLabel}
        </button>
      </nav>
    </header>
  );
}
