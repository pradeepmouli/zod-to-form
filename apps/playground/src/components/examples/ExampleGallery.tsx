import { useState } from "react";
import { EXAMPLES } from "./examples.ts";
import type { ExampleSchema } from "../../types/playground.ts";

interface ExampleGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (source: string) => void;
  hasUnsavedChanges: boolean;
}

const CATEGORY_LABELS: Record<ExampleSchema["category"], string> = {
  basic: "Basic",
  advanced: "Advanced",
  patterns: "Patterns",
};

export function ExampleGallery({
  isOpen,
  onClose,
  onSelect,
  hasUnsavedChanges,
}: ExampleGalleryProps) {
  const [filter, setFilter] = useState("");

  if (!isOpen) return null;

  const filtered = EXAMPLES.filter(
    (ex) =>
      !filter ||
      ex.title.toLowerCase().includes(filter.toLowerCase()) ||
      ex.tags.some((t) => t.toLowerCase().includes(filter.toLowerCase())),
  );

  const grouped: Record<string, ExampleSchema[]> = {};
  for (const ex of filtered) {
    if (!grouped[ex.category]) grouped[ex.category] = [];
    grouped[ex.category].push(ex);
  }

  const handleSelect = (source: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Loading an example will replace your current schema. Continue?",
      );
      if (!confirmed) return;
    }
    onSelect(source);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-100">Example Schemas</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-lg leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="p-4 border-b border-zinc-800">
          <input
            type="text"
            placeholder="Search examples..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-500 outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {(["basic", "advanced", "patterns"] as const).map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="space-y-1">
                  {items.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleSelect(ex.source)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-zinc-800 transition-colors"
                    >
                      <div className="text-sm font-medium text-zinc-200">
                        {ex.title}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {ex.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4">
              No examples match your search
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
