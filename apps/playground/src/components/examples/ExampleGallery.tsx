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
      <div
        className="w-full max-w-lg max-h-[80vh] flex flex-col"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius)",
        }}
      >
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Example Schemas
          </h2>
          <button
            onClick={onClose}
            className="text-lg leading-none transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="p-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <input
            type="text"
            placeholder="Search examples..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {(["basic", "advanced", "patterns"] as const).map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <div key={cat}>
                <h3
                  className="text-xs font-medium uppercase tracking-wide mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="space-y-1">
                  {items.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleSelect(ex.source)}
                      className="w-full text-left px-3 py-2 rounded-lg transition-colors"
                      style={{ color: "var(--text-primary)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--bg-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <div className="text-sm font-medium">
                        {ex.title}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {ex.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p
              className="text-sm text-center py-4"
              style={{ color: "var(--text-muted)" }}
            >
              No examples match your search
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
