import { useState, useEffect, useRef } from "react";

const SHADCN_REGISTRY_BASE = "https://ui.shadcn.com/r";
const SHADCN_INDEX_URL = `${SHADCN_REGISTRY_BASE}/index.json`;
const SHADCN_DOCS_URL = "https://ui.shadcn.com/docs/directory";

const SUPPORTED_COMPONENTS = new Set([
  "input",
  "textarea",
  "select",
  "checkbox",
  "switch",
  "label",
  "button",
  "radio-group",
]);

interface RegistryIndexItem {
  name: string;
  type: string;
  registryDependencies?: string[];
}

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
  compilationErrors?: Record<string, string>;
}

export function CustomComponentImport({
  isOpen,
  onClose,
  onImport,
  onSwitchToShadcn,
  compilationErrors = {},
}: CustomComponentImportProps) {
  const [search, setSearch] = useState("");
  const [registry, setRegistry] = useState<RegistryIndexItem[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<FetchedComponent[]>([]);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (registry.length > 0) {
      searchRef.current?.focus();
      return;
    }

    setRegistryLoading(true);
    setRegistryError(null);

    fetch(SHADCN_INDEX_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: RegistryIndexItem[]) => {
        const uiComponents = data.filter((item) => item.type === "registry:ui");
        uiComponents.sort((a, b) => a.name.localeCompare(b.name));
        setRegistry(uiComponents);
        setRegistryLoading(false);
        setTimeout(() => searchRef.current?.focus(), 50);
      })
      .catch(() => {
        setRegistryError("Failed to load registry index. Check your connection.");
        setRegistryLoading(false);
      });
  }, [isOpen, registry.length]);

  if (!isOpen) return null;

  const searchLower = search.toLowerCase().trim();
  const filtered = searchLower
    ? registry.filter((item) => item.name.includes(searchLower))
    : registry;

  const fetchedNames = new Set(fetched.map((c) => c.name));

  const fetchComponent = async (name: string) => {
    if (fetchedNames.has(name)) {
      setError(`"${name}" is already in the list`);
      return;
    }

    setIsFetching(name);
    setError(null);

    try {
      let res = await fetch(
        `${SHADCN_REGISTRY_BASE}/styles/new-york/${name}.json`,
      );
      if (!res.ok) {
        res = await fetch(`${SHADCN_REGISTRY_BASE}/${name}.json`);
      }
      if (!res.ok) {
        setError(
          `Component "${name}" not found in the shadcn registry.`,
        );
        setIsFetching(null);
        return;
      }

      const data: RegistryItem = await res.json();
      const mainFile = data.files?.[0];
      if (!mainFile?.content) {
        setError(
          `Component "${name}" has no source code in the registry.`,
        );
        setIsFetching(null);
        return;
      }

      const title =
        data.title ||
        name
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join("");

      setFetched((prev) => [
        ...prev,
        {
          name,
          title,
          code: mainFile.content,
          dependencies: data.dependencies ?? [],
        },
      ]);
    } catch {
      setError(
        "Failed to fetch component. Check your connection.",
      );
    } finally {
      setIsFetching(null);
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
      components[comp.name] = comp.code;
    }
    onImport(components);
    if (onSwitchToShadcn) {
      onSwitchToShadcn();
    }
    setFetched([]);
    setSearch("");
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
      <div className="modal-panel w-full max-w-lg max-h-[85vh] flex flex-col">
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div>
            <h2
              className="text-sm font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Import shadcn/ui Components
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {registry.length > 0
                ? `${registry.length} components available`
                : "Loading registry..."}
            </p>
          </div>
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

        <div className="p-4 space-y-3 overflow-auto flex-1 min-h-0">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components..."
            className="input-glass w-full px-3 py-2 text-sm"
            autoFocus
          />

          {registryLoading && (
            <div
              className="text-xs text-center py-8"
              style={{ color: "var(--text-muted)" }}
            >
              Loading shadcn/ui registry...
            </div>
          )}

          {registryError && (
            <div
              className="glass-panel text-xs p-3 text-center"
              style={{
                color: "rgb(248, 113, 113)",
                background: "rgba(239, 68, 68, 0.06)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
              }}
            >
              {registryError}
            </div>
          )}

          {!registryLoading && !registryError && filtered.length === 0 && (
            <div
              className="text-xs text-center py-6"
              style={{ color: "var(--text-muted)" }}
            >
              {searchLower
                ? `No components matching "${search}"`
                : "No components found"}
            </div>
          )}

          {!registryLoading && filtered.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {filtered.map((item) => {
                const isSupported = SUPPORTED_COMPONENTS.has(item.name);
                const isAlreadyFetched = fetchedNames.has(item.name);
                const isCurrentlyFetching = isFetching === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => fetchComponent(item.name)}
                    disabled={isAlreadyFetched || isCurrentlyFetching || isFetching !== null}
                    className="btn-glass text-xs px-2.5 py-1.5 disabled:cursor-not-allowed transition-all"
                    style={{
                      opacity: isAlreadyFetched ? 0.4 : isSupported ? 1 : 0.7,
                      borderColor: isAlreadyFetched
                        ? "rgba(34, 197, 94, 0.3)"
                        : isSupported
                          ? "rgba(249, 115, 22, 0.25)"
                          : undefined,
                      background: isAlreadyFetched
                        ? "rgba(34, 197, 94, 0.08)"
                        : undefined,
                    }}
                    title={
                      isAlreadyFetched
                        ? "Already added"
                        : isSupported
                          ? "Supported — bundled Radix dependencies"
                          : "May need additional dependencies"
                    }
                  >
                    {isCurrentlyFetching ? (
                      <span style={{ color: "var(--accent-violet)" }}>
                        fetching...
                      </span>
                    ) : (
                      <>
                        {isAlreadyFetched && (
                          <span style={{ color: "rgb(34, 197, 94)", marginRight: 4 }}>
                            ✓
                          </span>
                        )}
                        {item.name}
                        {isSupported && !isAlreadyFetched && (
                          <span
                            style={{
                              color: "var(--accent-violet)",
                              marginLeft: 4,
                              fontSize: "0.65rem",
                            }}
                          >
                            ●
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!registryLoading && registry.length > 0 && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <span style={{ color: "var(--accent-violet)" }}>●</span>
              Supported (bundled Radix deps) — others may need missing dependencies.{" "}
              <a
                href={SHADCN_DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-violet)" }}
                className="underline"
              >
                Docs
              </a>
            </p>
          )}

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
            <div
              className="pt-3 space-y-2"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <h3
                className="text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Ready to import ({fetched.length})
              </h3>
              {fetched.map((comp) => {
                const compError = compilationErrors[comp.name];
                return (
                  <div
                    key={comp.name}
                    className="rounded-lg overflow-hidden"
                    style={{
                      background: "rgba(15, 20, 32, 0.6)",
                      border: compError
                        ? "1px solid rgba(239, 68, 68, 0.3)"
                        : "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="min-w-0 flex items-center gap-2">
                        <span
                          className="text-sm"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {comp.name}
                        </span>
                        {comp.dependencies.length > 0 && (
                          <span
                            className="text-xs truncate"
                            style={{ color: "var(--text-muted)" }}
                          >
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
                    {compError && (
                      <div
                        className="px-3 pb-2 text-xs"
                        style={{ color: "rgb(248, 113, 113)" }}
                      >
                        Compilation failed: {compError}
                      </div>
                    )}
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
                );
              })}
              <button
                onClick={handleImport}
                className="btn-accent w-full text-xs px-3 py-2.5 rounded-lg font-medium"
              >
                Compile & Import {fetched.length} Component
                {fetched.length > 1 ? "s" : ""}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
