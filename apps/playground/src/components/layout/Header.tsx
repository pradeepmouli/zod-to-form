import { useState } from "react";
import type { ComponentMapType } from "../../types/playground.ts";
import { encodeShareState } from "../../lib/share.ts";

interface HeaderProps {
  componentMap: ComponentMapType;
  onComponentMapChange: (map: ComponentMapType) => void;
  editorContent: string;
  onExamplesClick: () => void;
  onConfigClick: () => void;
  onCustomImportClick: () => void;
  customComponentCount: number;
}

export function Header({
  componentMap,
  onComponentMapChange,
  editorContent,
  onExamplesClick,
  onConfigClick,
  onCustomImportClick,
  customComponentCount,
}: HeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const hash = encodeShareState({ code: editorContent, map: componentMap });
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <header
      className="glass-surface flex items-center justify-between px-5 py-3"
      style={{
        borderBottom: "1px solid var(--border-subtle)",
      }}
      role="banner"
    >
      <div className="flex items-center gap-3">
        <h1
          className="text-base font-bold tracking-tight"
          style={{
            background: "var(--accent-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Z2F Studio
        </h1>
        <span
          className="text-xs hidden sm:inline"
          style={{ color: "var(--text-muted)" }}
        >
          Interactive Playground
        </span>
      </div>

      <nav className="flex items-center gap-2" aria-label="Playground controls">
        <select
          value={componentMap}
          onChange={(e) =>
            onComponentMapChange(e.target.value as ComponentMapType)
          }
          className="btn-glass text-xs px-2.5 py-1.5 outline-none cursor-pointer"
          aria-label="Component map"
        >
          <option value="default">Default</option>
          <option value="shadcn">shadcn/ui</option>
        </select>

        <button
          onClick={onExamplesClick}
          className="btn-glass text-xs px-3 py-1.5"
          aria-label="Browse example schemas"
        >
          Examples
        </button>

        <button
          onClick={onConfigClick}
          className="btn-glass text-xs px-3 py-1.5"
          aria-label="Import or export config"
        >
          Config
        </button>

        <button
          onClick={onCustomImportClick}
          className="btn-glass text-xs px-3 py-1.5"
          aria-label="Import custom components"
        >
          Components{customComponentCount > 0 ? ` (${customComponentCount})` : ""}
        </button>

        <button
          onClick={handleShare}
          className="btn-glass text-xs px-3 py-1.5"
          style={
            copied
              ? { color: "var(--accent-violet)", borderColor: "var(--border-glow)" }
              : undefined
          }
          aria-label="Copy share URL to clipboard"
        >
          {copied ? "Copied!" : "Share"}
        </button>
      </nav>
    </header>
  );
}
