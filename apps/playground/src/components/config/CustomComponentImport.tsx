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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-100">
            Import shadcn/ui Components
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-lg leading-none"
            aria-label="Close custom component import"
          >
            &times;
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-auto">
          <p className="text-xs text-zinc-400">
            Browse components from the{" "}
            <a
              href={SHADCN_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 underline hover:text-violet-300"
            >
              shadcn/ui registry
            </a>
            . Importing will switch the preview to the shadcn component map and
            save the source code for reference.
          </p>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">
              Quick Add
            </label>
            <div className="flex flex-wrap gap-1">
              {COMMON_COMPONENTS.filter(
                (c) => !fetched.some((f) => f.name === c),
              )
                .slice(0, 12)
                .map((name) => (
                  <button
                    key={name}
                    onClick={() => fetchComponent(name)}
                    disabled={isFetching}
                    className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded transition-colors disabled:opacity-50"
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
              className="flex-1 px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-500 outline-none focus:border-violet-500 disabled:opacity-50"
            />
            <button
              onClick={() => fetchComponent(customName)}
              disabled={isFetching || !customName.trim()}
              className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              {isFetching ? "Fetching..." : "Fetch"}
            </button>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded p-2">
              {error}
            </div>
          )}

          {fetched.length > 0 && (
            <div className="border-t border-zinc-800 pt-4 space-y-2">
              <h3 className="text-xs font-medium text-zinc-400">
                Fetched Components ({fetched.length})
              </h3>
              {fetched.map((comp) => (
                <div key={comp.name} className="bg-zinc-800/50 rounded overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="text-sm text-zinc-200 font-mono">
                        {comp.name}
                      </span>
                      {comp.dependencies.length > 0 && (
                        <span className="text-xs text-zinc-500">
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
                        className="text-xs text-violet-400 hover:text-violet-300"
                      >
                        {expandedSource === comp.name ? "Hide" : "Source"}
                      </button>
                      <button
                        onClick={() => handleRemove(comp.name)}
                        className="text-xs text-red-400 hover:text-red-300"
                        aria-label={`Remove ${comp.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {expandedSource === comp.name && (
                    <pre className="px-3 pb-3 text-xs text-zinc-400 overflow-auto max-h-48 border-t border-zinc-700/50">
                      <code>{comp.code}</code>
                    </pre>
                  )}
                </div>
              ))}
              <button
                onClick={handleImport}
                className="w-full text-xs px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors font-medium"
              >
                Import {fetched.length} Component
                {fetched.length > 1 ? "s" : ""} &amp; Switch to shadcn
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
