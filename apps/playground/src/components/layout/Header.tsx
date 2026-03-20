import { useState } from "react";
import type { ComponentMapType, PlaygroundConfig } from "../../types/playground.ts";
import { encodeShareState } from "../../lib/share.ts";

interface HeaderProps {
  componentMap: ComponentMapType;
  onComponentMapChange: (map: ComponentMapType) => void;
  editorContent: string;
  onExamplesClick: () => void;
  onConfigClick: () => void;
}

export function Header({
  componentMap,
  onComponentMapChange,
  editorContent,
  onExamplesClick,
  onConfigClick,
}: HeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const hash = encodeShareState({ code: editorContent, map: componentMap });
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header
      className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800"
      role="banner"
    >
      <div className="flex items-center gap-2">
        <h1 className="text-base font-bold text-violet-400">Z2F Studio</h1>
        <span className="text-xs text-zinc-500 hidden sm:inline">
          Interactive Playground
        </span>
      </div>

      <nav className="flex items-center gap-2" aria-label="Playground controls">
        <select
          value={componentMap}
          onChange={(e) =>
            onComponentMapChange(e.target.value as ComponentMapType)
          }
          className="text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 rounded px-2 py-1 outline-none focus:border-violet-500"
          aria-label="Component map"
        >
          <option value="default">Default</option>
          <option value="shadcn">shadcn/ui</option>
        </select>

        <button
          onClick={onExamplesClick}
          className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded transition-colors"
          aria-label="Browse example schemas"
        >
          Examples
        </button>

        <button
          onClick={onConfigClick}
          className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded transition-colors"
          aria-label="Import or export config"
        >
          Config
        </button>

        <button
          onClick={handleShare}
          className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded transition-colors"
          aria-label="Copy share URL to clipboard"
        >
          {copied ? "Copied!" : "Share"}
        </button>
      </nav>
    </header>
  );
}
