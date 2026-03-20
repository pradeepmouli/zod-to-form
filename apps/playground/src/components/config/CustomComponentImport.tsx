import { useState, useEffect, useRef, useCallback } from "react";

const REGISTRIES_URL = "https://ui.shadcn.com/r/registries.json";

const INJECTED_CSS_ID = "z2f-registry-css";

function injectRegistryCss(cssContents: string[]) {
  let style = document.getElementById(INJECTED_CSS_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = INJECTED_CSS_ID;
    document.head.appendChild(style);
  }
  const combined = cssContents.join("\n\n");
  style.textContent = (style.textContent ?? "") + "\n" + combined;
}

const CORS_SAFE_HOSTS = ["ui.shadcn.com"];

function registryFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    const parsed = new URL(url);
    if (CORS_SAFE_HOSTS.includes(parsed.hostname)) {
      return fetch(url, init);
    }
  } catch {
    return fetch(url, init);
  }
  const proxied = `/api/registry-proxy?url=${encodeURIComponent(url)}`;
  return fetch(proxied, init);
}

interface CommunityRegistry {
  name: string;
  homepage: string;
  url: string;
  description: string;
}

interface RegistryComponentItem {
  name: string;
  type: string;
  dependencies?: string[];
}

interface RegistryFile {
  path: string;
  type: string;
  content: string;
}

interface RegistryItemDetail {
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
  cssFiles: string[];
  dependencies: string[];
  library: string;
}

const SHADCN_ENTRY: CommunityRegistry = {
  name: "shadcn/ui",
  homepage: "https://ui.shadcn.com",
  url: "https://ui.shadcn.com/r/styles/new-york/{name}.json",
  description:
    "Beautifully designed components that you can copy and paste into your apps. Built with Radix UI and Tailwind CSS.",
};

function deriveIndexUrl(urlPattern: string): string {
  return urlPattern.replace("{name}", "index");
}

function deriveComponentUrl(urlPattern: string, name: string): string {
  return urlPattern.replace("{name}", name);
}

const PROBE_NAMES = [
  "accordion", "alert", "alert-dialog", "aspect-ratio", "avatar",
  "badge", "breadcrumb", "button", "calendar", "card",
  "carousel", "chart", "checkbox", "collapsible", "combobox",
  "command", "context-menu", "dialog", "drawer", "dropdown-menu",
  "form", "hover-card", "input", "input-otp", "label",
  "menubar", "navigation-menu", "pagination", "popover", "progress",
  "radio-group", "resizable", "scroll-area", "select", "separator",
  "sheet", "sidebar", "skeleton", "slider", "sonner",
  "switch", "table", "tabs", "textarea", "toggle",
  "toggle-group", "tooltip",
];

async function probeRegistry(
  urlPattern: string,
): Promise<RegistryComponentItem[]> {
  const results = await Promise.allSettled(
    PROBE_NAMES.map(async (name) => {
      const url = deriveComponentUrl(urlPattern, name);
      const controller = new AbortController();
      const res = await registryFetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        controller.abort();
        return { name, type: "registry:ui" as const };
      }
      return null;
    }),
  );

  const found: RegistryComponentItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      found.push(r.value);
    }
  }
  found.sort((a, b) => a.name.localeCompare(b.name));
  return found;
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
  const [registries, setRegistries] = useState<CommunityRegistry[]>([]);
  const [registriesLoading, setRegistriesLoading] = useState(false);
  const [registriesError, setRegistriesError] = useState<string | null>(null);

  const [selectedLibrary, setSelectedLibrary] =
    useState<CommunityRegistry | null>(null);
  const [components, setComponents] = useState<RegistryComponentItem[]>([]);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [indexAvailable, setIndexAvailable] = useState(true);
  const [componentSearch, setComponentSearch] = useState("");

  const [isFetching, setIsFetching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<FetchedComponent[]>([]);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const componentSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (registries.length > 0) {
      searchRef.current?.focus();
      return;
    }

    setRegistriesLoading(true);
    setRegistriesError(null);

    fetch(REGISTRIES_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: CommunityRegistry[]) => {
        data.sort((a, b) => a.name.localeCompare(b.name));
        setRegistries(data);
        setRegistriesLoading(false);
        setTimeout(() => searchRef.current?.focus(), 50);
      })
      .catch(() => {
        setRegistriesError(
          "Failed to load community registries. Check your connection.",
        );
        setRegistriesLoading(false);
      });
  }, [isOpen, registries.length]);

  const selectLibrary = useCallback(
    (lib: CommunityRegistry) => {
      setSelectedLibrary(lib);
      setComponents([]);
      setComponentsLoading(true);
      setIndexAvailable(true);
      setComponentSearch("");
      setError(null);

      const indexUrl = deriveIndexUrl(lib.url);

      registryFetch(indexUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data: RegistryComponentItem[] | { items?: RegistryComponentItem[] }) => {
          let items: RegistryComponentItem[];
          if (Array.isArray(data)) {
            items = data;
          } else if (data.items && Array.isArray(data.items)) {
            items = data.items;
          } else {
            items = [];
          }

          const uiItems = items.filter(
            (item) =>
              item.type === "registry:ui" ||
              item.type === "registry:component" ||
              item.type === "registry:block",
          );
          uiItems.sort((a, b) => a.name.localeCompare(b.name));
          if (uiItems.length > 0) {
            setComponents(uiItems);
            setComponentsLoading(false);
            setTimeout(() => componentSearchRef.current?.focus(), 50);
          } else {
            probeRegistry(lib.url).then((probed) => {
              setComponents(probed);
              if (probed.length === 0) setIndexAvailable(false);
              setComponentsLoading(false);
              setTimeout(() => componentSearchRef.current?.focus(), 50);
            });
          }
        })
        .catch(() => {
          probeRegistry(lib.url).then((probed) => {
            setComponents(probed);
            if (probed.length === 0) setIndexAvailable(false);
            setComponentsLoading(false);
            setTimeout(() => componentSearchRef.current?.focus(), 50);
          });
        });
    },
    [],
  );

  const fetchComponent = useCallback(
    async (name: string) => {
      if (!selectedLibrary) return;
      const key = `${selectedLibrary.name}/${name}`;
      if (fetched.some((c) => c.name === key)) {
        setError(`"${name}" from ${selectedLibrary.name} is already added`);
        return;
      }

      setIsFetching(name);
      setError(null);

      try {
        const url = deriveComponentUrl(selectedLibrary.url, name);
        const res = await registryFetch(url);
        if (!res.ok) {
          setError(`Component "${name}" not found in ${selectedLibrary.name}.`);
          setIsFetching(null);
          return;
        }

        const data: RegistryItemDetail = await res.json();
        const tsxFile = data.files?.find(
          (f) => f.content && (f.path.endsWith(".tsx") || f.path.endsWith(".ts") || f.path.endsWith(".jsx") || f.path.endsWith(".js")),
        );
        if (!tsxFile?.content) {
          setError(`Component "${name}" has no source code in the registry.`);
          setIsFetching(null);
          return;
        }

        const cssFiles = (data.files ?? [])
          .filter((f) => f.content && f.path.endsWith(".css"))
          .map((f) => f.content);

        const title =
          data.title ||
          name
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join("");

        const newComponents: FetchedComponent[] = [];

        const regDeps = data.registryDependencies ?? [];
        if (regDeps.length > 0) {
          const existingNames = new Set(fetched.map((c) => {
            const sn = c.name.includes("/") ? c.name.split("/").pop()! : c.name;
            return sn;
          }));

          for (const dep of regDeps) {
            if (existingNames.has(dep)) continue;
            try {
              const depUrl = SHADCN_ENTRY.url.replace("{name}", dep);
              const depRes = await registryFetch(depUrl);
              if (!depRes.ok) continue;
              const depData: RegistryItemDetail = await depRes.json();
              const depTsx = depData.files?.find(
                (f) => f.content && (f.path.endsWith(".tsx") || f.path.endsWith(".ts")),
              );
              if (!depTsx?.content) continue;
              const depCss = (depData.files ?? [])
                .filter((f) => f.content && f.path.endsWith(".css"))
                .map((f) => f.content);
              newComponents.push({
                name: dep,
                title: dep.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(""),
                code: depTsx.content,
                cssFiles: depCss,
                dependencies: depData.dependencies ?? [],
                library: "shadcn/ui (auto)",
              });
              existingNames.add(dep);
            } catch {
              console.warn(`[z2f] Failed to auto-fetch registry dependency: ${dep}`);
            }
          }
        }

        newComponents.push({
          name: key,
          title,
          code: tsxFile.content,
          cssFiles,
          dependencies: data.dependencies ?? [],
          library: selectedLibrary.name,
        });

        setFetched((prev) => [...prev, ...newComponents]);
      } catch {
        setError("Failed to fetch component. Check your connection.");
      } finally {
        setIsFetching(null);
      }
    },
    [selectedLibrary, fetched],
  );

  const handleRemove = (name: string) => {
    setFetched((prev) => prev.filter((c) => c.name !== name));
    if (expandedSource === name) setExpandedSource(null);
  };

  const handleImport = () => {
    if (fetched.length === 0) {
      setError("Add at least one component before importing");
      return;
    }
    const importMap: Record<string, string> = {};
    const seen = new Set<string>();
    for (const comp of fetched) {
      let shortName = comp.name.includes("/")
        ? comp.name.split("/").pop()!
        : comp.name;
      if (seen.has(shortName)) {
        const lib = comp.library.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        shortName = `${lib}-${shortName}`;
      }
      seen.add(shortName);
      importMap[shortName] = comp.code;
    }

    const allCss = fetched.flatMap((c) => c.cssFiles);
    if (allCss.length > 0) {
      injectRegistryCss(allCss);
    }

    onImport(importMap);
    if (onSwitchToShadcn) {
      onSwitchToShadcn();
    }
    setFetched([]);
    setSearch("");
    setError(null);
    onClose();
  };

  const goBack = () => {
    setSelectedLibrary(null);
    setComponents([]);
    setIndexAvailable(true);
    setComponentSearch("");
    setError(null);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  if (!isOpen) return null;

  const fetchedNames = new Set(fetched.map((c) => c.name));

  const allRegistries = [SHADCN_ENTRY, ...registries];
  const searchLower = search.toLowerCase().trim();
  const filteredRegistries = searchLower
    ? allRegistries.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower),
      )
    : allRegistries;

  const compSearchLower = componentSearch.toLowerCase().trim();
  const filteredComponents = compSearchLower
    ? components.filter((c) => c.name.includes(compSearchLower))
    : components;

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
          <div className="flex items-center gap-2 min-w-0">
            {selectedLibrary && (
              <button
                onClick={goBack}
                className="text-sm transition-colors shrink-0"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
                aria-label="Back to library list"
              >
                &larr;
              </button>
            )}
            <div className="min-w-0">
              <h2
                className="text-sm font-bold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {selectedLibrary
                  ? selectedLibrary.name
                  : "Component Libraries"}
              </h2>
              <p
                className="text-xs mt-0.5 truncate"
                style={{ color: "var(--text-muted)" }}
              >
                {selectedLibrary
                  ? `${components.length > 0 ? `${components.length} components` : componentsLoading ? "Loading..." : "Browse components"}`
                  : registries.length > 0
                    ? `${allRegistries.length} registries from shadcn/ui community`
                    : "Loading registries..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-lg leading-none transition-colors w-7 h-7 flex items-center justify-center rounded-md shrink-0"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-auto flex-1 min-h-0">
          {!selectedLibrary && (
            <LibraryBrowser
              searchRef={searchRef}
              search={search}
              onSearchChange={setSearch}
              registries={filteredRegistries}
              loading={registriesLoading}
              error={registriesError}
              searchTerm={searchLower}
              onSelect={selectLibrary}
            />
          )}

          {selectedLibrary && (
            <ComponentBrowser
              searchRef={componentSearchRef}
              search={componentSearch}
              onSearchChange={setComponentSearch}
              components={filteredComponents}
              loading={componentsLoading}
              indexAvailable={indexAvailable}
              searchTerm={compSearchLower}
              library={selectedLibrary}
              isFetching={isFetching}
              fetchedNames={fetchedNames}
              onFetch={fetchComponent}
            />
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
                const shortName = comp.name.includes("/")
                  ? comp.name.split("/").pop()!
                  : comp.name;
                const compError = compilationErrors[shortName];
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
                          {shortName}
                        </span>
                        <span
                          className="text-xs truncate"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {comp.library}
                        </span>
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
                          aria-label={`Remove ${shortName}`}
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

function LibraryBrowser({
  searchRef,
  search,
  onSearchChange,
  registries,
  loading,
  error,
  searchTerm,
  onSelect,
}: {
  searchRef: React.RefObject<HTMLInputElement | null>;
  search: string;
  onSearchChange: (value: string) => void;
  registries: CommunityRegistry[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  onSelect: (lib: CommunityRegistry) => void;
}) {
  return (
    <>
      <input
        ref={searchRef}
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search libraries..."
        className="input-glass w-full px-3 py-2 text-sm"
      />

      {loading && (
        <div
          className="text-xs text-center py-8"
          style={{ color: "var(--text-muted)" }}
        >
          Loading community registries...
        </div>
      )}

      {error && (
        <div
          className="glass-panel text-xs p-3 text-center"
          style={{
            color: "rgb(248, 113, 113)",
            background: "rgba(239, 68, 68, 0.06)",
            border: "1px solid rgba(239, 68, 68, 0.15)",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && registries.length === 0 && (
        <div
          className="text-xs text-center py-6"
          style={{ color: "var(--text-muted)" }}
        >
          {searchTerm
            ? `No libraries matching "${searchTerm}"`
            : "No registries found"}
        </div>
      )}

      {!loading && registries.length > 0 && (
        <div className="space-y-1">
          {registries.map((lib) => (
            <button
              key={lib.name}
              onClick={() => onSelect(lib)}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-all"
              style={{
                background: "rgba(15, 20, 32, 0.4)",
                border: "1px solid var(--border-subtle)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(15, 20, 32, 0.8)";
                e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(15, 20, 32, 0.4)";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-primary)",
                  }}
                >
                  {lib.name}
                </span>
                <span
                  className="text-xs shrink-0 ml-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  &rarr;
                </span>
              </div>
              <p
                className="text-xs mt-0.5 line-clamp-2"
                style={{ color: "var(--text-muted)" }}
              >
                {lib.description}
              </p>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function ComponentBrowser({
  searchRef,
  search,
  onSearchChange,
  components,
  loading,
  indexAvailable,
  searchTerm,
  library,
  isFetching,
  fetchedNames,
  onFetch,
}: {
  searchRef: React.RefObject<HTMLInputElement | null>;
  search: string;
  onSearchChange: (value: string) => void;
  components: RegistryComponentItem[];
  loading: boolean;
  indexAvailable: boolean;
  searchTerm: string;
  library: CommunityRegistry;
  isFetching: string | null;
  fetchedNames: Set<string>;
  onFetch: (name: string) => void;
}) {
  const hasComponents = !loading && components.length > 0;
  const showManualEntry = !loading && !indexAvailable;

  return (
    <>
      {hasComponents && (
        <div className="flex gap-2 items-center">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter components..."
            className="input-glass flex-1 px-3 py-2 text-sm"
          />
          <a
            href={library.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs shrink-0 px-2 py-1.5 rounded transition-colors"
            style={{ color: "var(--accent-violet)" }}
          >
            Docs
          </a>
        </div>
      )}

      {loading && (
        <div
          className="text-xs text-center py-8"
          style={{ color: "var(--text-muted)" }}
        >
          Loading components from {library.name}...
        </div>
      )}

      {showManualEntry && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            This registry doesn&apos;t publish a component index. Type a
            component name to fetch it directly from{" "}
            <a
              href={library.homepage}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent-violet)" }}
              className="underline"
            >
              {library.name}
            </a>
            .
          </p>
          <div className="flex gap-2">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim()) onFetch(search.trim());
              }}
              placeholder="Component name (e.g., button)"
              disabled={isFetching !== null}
              className="input-glass flex-1 px-3 py-2 text-sm disabled:opacity-50"
            />
            <button
              onClick={() => {
                if (search.trim()) onFetch(search.trim());
              }}
              disabled={isFetching !== null || !search.trim()}
              className="btn-accent text-xs px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {isFetching ? "Fetching..." : "Fetch"}
            </button>
          </div>
        </div>
      )}

      {!loading && indexAvailable && components.length === 0 && (
        <div
          className="text-xs text-center py-6"
          style={{ color: "var(--text-muted)" }}
        >
          {searchTerm
            ? `No components matching "${searchTerm}"`
            : "No components found in this registry."}
        </div>
      )}

      {hasComponents && (
        <div className="flex flex-wrap gap-1.5">
          {components.map((item) => {
            const key = `${library.name}/${item.name}`;
            const isAlreadyFetched = fetchedNames.has(key);
            const isCurrentlyFetching = isFetching === item.name;

            return (
              <button
                key={item.name}
                onClick={() => onFetch(item.name)}
                disabled={
                  isAlreadyFetched ||
                  isCurrentlyFetching ||
                  isFetching !== null
                }
                className="btn-glass text-xs px-2.5 py-1.5 disabled:cursor-not-allowed transition-all"
                style={{
                  opacity: isAlreadyFetched ? 0.4 : 1,
                  borderColor: isAlreadyFetched
                    ? "rgba(34, 197, 94, 0.3)"
                    : undefined,
                  background: isAlreadyFetched
                    ? "rgba(34, 197, 94, 0.08)"
                    : undefined,
                }}
                title={isAlreadyFetched ? "Already added" : item.name}
              >
                {isCurrentlyFetching ? (
                  <span style={{ color: "var(--accent-violet)" }}>
                    fetching...
                  </span>
                ) : (
                  <>
                    {isAlreadyFetched && (
                      <span
                        style={{ color: "rgb(34, 197, 94)", marginRight: 4 }}
                      >
                        ✓
                      </span>
                    )}
                    {item.name}
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      {hasComponents && (
        <p
          className="text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          Components are compiled at runtime. Those with unsupported
          dependencies may show compilation errors.
        </p>
      )}
    </>
  );
}
