import { useState } from "react";

const SHADCN_REGISTRY_BASE = "https://ui.shadcn.com/r";
const SHADCN_DOCS_URL = "https://ui.shadcn.com/docs/directory";

const COMMON_COMPONENTS = [
  "input",
  "textarea",
  "select",
  "checkbox",
  "switch",
  "label",
  "button",
  "radio-group",
  "slider",
  "calendar",
  "popover",
  "dialog",
  "card",
  "tabs",
  "badge",
  "separator",
  "tooltip",
  "alert",
  "form",
];

interface RegistryFile {
  path: string;
  type: string;
  content: string;
}

interface RegistryItem {
  name: string;
  type: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
}

interface FetchedComponent {
  name: string;
  title: string;
  code: string;
  dependencies: string[];
}

interface CustomComponentImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (components: Record<string, string>) => void;
  onSwitchToShadcn?: () => void;
}

export function CustomComponentImport({
  isOpen,
  onClose,
  onImport,
  onSwitchToShadcn,
}: CustomComponentImportProps) {
  const [customName, setCustomName] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<FetchedComponent[]>([]);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  if (!isOpen) return null;

  const fetchComponent = async (name: string) => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) {
      setError("Enter a component name");
      return;
    }
    if (fetched.some((c) => c.name === normalized)) {
      setError(`"${normalized}" is already in the list`);
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      const res = await fetch(`${SHADCN_REGISTRY_BASE}/${normalized}.json`);
      if (!res.ok) {
        setError(
          `Component "${normalized}" not found in the shadcn registry. Check the name at ${SHADCN_DOCS_URL}`,
        );
        setIsFetching(false);
        return;
      }

      const data: RegistryItem = await res.json();
      const mainFile = data.files?.[0];
      if (!mainFile?.content) {
        setError(`Component "${normalized}" has no source code in the registry`);
        setIsFetching(false);
        return;
      }

      const title =
        data.title ||
        normalized
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join("");

      setFetched((prev) => [
        ...prev,
        {
          name: normalized,
          title,
          code: mainFile.content,
          dependencies: data.dependencies ?? [],
        },
      ]);
      setCustomName("");
    } catch {
      setError("Failed to fetch from the shadcn registry. Check your connection.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleRemove = (name: string) => {
    setFetched((prev) => prev.filter((c) => c.name !== name));
    if (expandedSource === name) setExpandedSource(null);
  };

  const handleImport = () => {
    if (fetched.length === 0) {
      setError("Add at least one component before importing");
      return;
    }
    const components: Record<string, string> = {};
    for (const comp of fetched) {
      components[comp.title] = comp.code;
    }
    onImport(components);
    if (onSwitchToShadcn) {
      onSwitchToShadcn();
    }
    setFetched([]);
    setCustomName("");
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel w-full max-w-lg max-h-[80vh] flex flex-col">
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Import shadcn/ui Components
          </h2>
          <button
            onClick={onClose}
            className="text-lg leading-none transition-colors w-7 h-7 flex items-center justify-center rounded-md"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
            aria-label="Close custom component import"
          >
            &times;
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-auto">
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Browse components from the{" "}
            <a
              href={SHADCN_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent-violet)" }}
              className="underline"
            >
              shadcn/ui registry
            </a>
            . Importing will switch the preview to the shadcn component map and
            save the source code for reference.
          </p>

          <div>
            <label className="text-xs block mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Quick Add
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_COMPONENTS.filter(
                (c) => !fetched.some((f) => f.name === c),
              )
                .slice(0, 12)
                .map((name) => (
                  <button
                    key={name}
                    onClick={() => fetchComponent(name)}
                    disabled={isFetching}
                    className="btn-glass text-xs px-2.5 py-1 disabled:opacity-50"
                  >
                    {name}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchComponent(customName);
              }}
              placeholder="Component name (e.g., accordion)"
              disabled={isFetching}
              className="input-glass flex-1 px-3 py-1.5 text-sm disabled:opacity-50"
            />
            <button
              onClick={() => fetchComponent(customName)}
              disabled={isFetching || !customName.trim()}
              className="btn-accent text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {isFetching ? "Fetching..." : "Fetch"}
            </button>
          </div>

          {error && (
            <div
              className="glass-panel text-xs p-2.5"
              style={{
                color: "rgb(248, 113, 113)",
                background: "rgba(239, 68, 68, 0.06)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
              }}
            >
              {error}
            </div>
          )}

          {fetched.length > 0 && (
            <div className="pt-4 space-y-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <h3 className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Fetched Components ({fetched.length})
              </h3>
              {fetched.map((comp) => (
                <div
                  key={comp.name}
                  className="rounded-lg overflow-hidden"
                  style={{
                    background: "rgba(15, 20, 32, 0.6)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="min-w-0 flex items-center gap-2">
                      <span
                        className="text-sm"
                        style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
                      >
                        {comp.name}
                      </span>
                      {comp.dependencies.length > 0 && (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          deps: {comp.dependencies.join(", ")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <button
                        onClick={() =>
                          setExpandedSource(
                            expandedSource === comp.name ? null : comp.name,
                          )
                        }
                        className="text-xs transition-colors"
                        style={{ color: "var(--accent-violet)" }}
                      >
                        {expandedSource === comp.name ? "Hide" : "Source"}
                      </button>
                      <button
                        onClick={() => handleRemove(comp.name)}
                        className="text-xs transition-colors"
                        style={{ color: "rgb(248, 113, 113)" }}
                        aria-label={`Remove ${comp.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {expandedSource === comp.name && (
                    <pre
                      className="px-3 pb-3 text-xs overflow-auto max-h-48"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-secondary)",
                        borderTop: "1px solid var(--border-subtle)",
                      }}
                    >
                      <code>{comp.code}</code>
                    </pre>
                  )}
                </div>
              ))}
              <button
                onClick={handleImport}
                className="btn-accent w-full text-xs px-3 py-2.5 rounded-lg font-medium"
              >
                Import {fetched.length} Component
                {fetched.length > 1 ? "s" : ""} & Switch to shadcn
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
