import { useState, useEffect, useRef, useCallback } from 'react';

const INJECTED_CSS_ID = 'z2f-registry-css';

function injectRegistryCss(cssContents: string[]) {
  let style = document.getElementById(INJECTED_CSS_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = INJECTED_CSS_ID;
    document.head.appendChild(style);
  }
  // Replace all CSS rather than appending to prevent unbounded growth
  // when importing multiple batches or re-importing the same component.
  const combined = cssContents.join('\n\n');
  style.textContent = combined;
}

interface CommunityRegistry {
  name: string;
  homepage?: string;
  url: string;
  description?: string;
}

interface SearchResultItem {
  registry: string;
  name: string;
  addCommandArgument: string;
  type?: string;
  description?: string;
}

interface ResolvedFile {
  path: string;
  type: string;
  content: string | null;
}

interface ResolveResult {
  files: ResolvedFile[];
  dependencies: string[];
  devDependencies: string[];
  cssVars: Record<string, Record<string, string>>;
}

interface FetchedComponent {
  name: string;
  title: string;
  resolvedFiles: ResolvedFile[];
  cssFiles: string[];
  dependencies: string[];
  library: string;
}

interface CustomComponentImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (components: Record<string, string>) => void;
  onSwitchToStyled?: () => void;
  compilationErrors?: Record<string, string>;
}

export function CustomComponentImport({
  isOpen,
  onClose,
  onImport,
  onSwitchToStyled,
  compilationErrors = {}
}: CustomComponentImportProps) {
  const [search, setSearch] = useState('');
  const [registries, setRegistries] = useState<CommunityRegistry[]>([]);
  const [registriesLoading, setRegistriesLoading] = useState(false);
  const [registriesError, setRegistriesError] = useState<string | null>(null);

  const [selectedLibrary, setSelectedLibrary] = useState<CommunityRegistry | null>(null);
  const [components, setComponents] = useState<SearchResultItem[]>([]);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [componentSearch, setComponentSearch] = useState('');

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

    fetch('/api/shadcn/registries')
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
        setRegistriesError('Failed to load registries. Check your connection.');
        setRegistriesLoading(false);
      });
  }, [isOpen, registries.length]);

  const selectLibrary = useCallback((lib: CommunityRegistry) => {
    setSelectedLibrary(lib);
    setComponents([]);
    setComponentsLoading(true);
    setComponentSearch('');
    setError(null);

    const registryName = lib.name.startsWith('@') ? lib.name : `@${lib.name}`;

    fetch(`/api/shadcn/search?registry=${encodeURIComponent(registryName)}&limit=200`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { items: SearchResultItem[]; pagination: { total: number } }) => {
        const items = data.items ?? [];
        items.sort((a, b) => a.name.localeCompare(b.name));
        setComponents(items);
        setComponentsLoading(false);
        setTimeout(() => componentSearchRef.current?.focus(), 50);
      })
      .catch(() => {
        setComponents([]);
        setComponentsLoading(false);
        setError('Failed to load components. Check your connection.');
      });
  }, []);

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
        const registryName = selectedLibrary.name.startsWith('@')
          ? selectedLibrary.name
          : `@${selectedLibrary.name}`;
        const itemArg =
          registryName === '@shadcn' || !selectedLibrary.name.startsWith('@')
            ? name
            : `${registryName}/${name}`;

        const res = await fetch('/api/shadcn/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [itemArg] })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          setError(err.error ?? `Component "${name}" not found.`);
          setIsFetching(null);
          return;
        }

        const data: ResolveResult = await res.json();

        if (!data.files || data.files.length === 0) {
          setError(`No files returned for "${name}".`);
          setIsFetching(null);
          return;
        }

        const cssFiles = data.files
          .filter((f) => f.content && f.path.endsWith('.css'))
          .map((f) => f.content!);

        const title = name
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        setFetched((prev) => [
          ...prev,
          {
            name: key,
            title,
            resolvedFiles: data.files.filter((f) => f.content != null),
            cssFiles,
            dependencies: data.dependencies,
            library: selectedLibrary.name
          }
        ]);
      } catch (err) {
        const message =
          err instanceof TypeError && String(err).includes('fetch')
            ? 'Network error — check your connection.'
            : 'Failed to resolve component. See browser console for details.';
        console.warn('[zod-to-form] Component resolve failed:', err);
        setError(message);
      } finally {
        setIsFetching(null);
      }
    },
    [selectedLibrary, fetched]
  );

  const handleRemove = (name: string) => {
    setFetched((prev) => prev.filter((c) => c.name !== name));
    if (expandedSource === name) setExpandedSource(null);
  };

  const handleImport = () => {
    if (fetched.length === 0) {
      setError('Add at least one component before importing');
      return;
    }

    const importMap: Record<string, string> = {};

    for (const comp of fetched) {
      for (const file of comp.resolvedFiles) {
        if (!file.content) continue;
        if (file.path.endsWith('.css')) continue;

        const moduleKey = file.path
          .replace(/\.(tsx|ts|jsx|js)$/, '')
          .replace(/^registry\/[^/]+\//, '');

        importMap[moduleKey] = file.content;
      }
    }

    const allCss = fetched.flatMap((c) => c.cssFiles);
    if (allCss.length > 0) {
      injectRegistryCss(allCss);
    }

    onImport(importMap);
    if (onSwitchToStyled) {
      onSwitchToStyled();
    }
    setFetched([]);
    setSearch('');
    setError(null);
    onClose();
  };

  const goBack = () => {
    setSelectedLibrary(null);
    setComponents([]);
    setComponentSearch('');
    setError(null);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  if (!isOpen) return null;

  const fetchedNames = new Set(fetched.map((c) => c.name));

  const SHADCN_ENTRY: CommunityRegistry = {
    name: '@shadcn',
    homepage: 'https://ui.shadcn.com',
    url: 'https://ui.shadcn.com/r/{name}.json',
    description: 'Beautifully designed components built with Radix UI and Tailwind CSS.'
  };
  const allRegistries = [SHADCN_ENTRY, ...registries];
  const searchLower = search.toLowerCase().trim();
  const filteredRegistries = searchLower
    ? allRegistries.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          (r.description ?? '').toLowerCase().includes(searchLower)
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
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {selectedLibrary && (
              <button
                onClick={goBack}
                className="text-sm transition-colors shrink-0"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                aria-label="Back to library list"
              >
                &larr;
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {selectedLibrary ? selectedLibrary.name : 'Component Libraries'}
              </h2>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                {selectedLibrary
                  ? `${components.length > 0 ? `${components.length} components` : componentsLoading ? 'Loading...' : 'Browse components'}`
                  : registries.length > 0
                    ? `${allRegistries.length} registries via shadcn`
                    : 'Loading registries...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-lg leading-none transition-colors w-7 h-7 flex items-center justify-center rounded-md shrink-0"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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
                color: 'rgb(248, 113, 113)',
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.15)'
              }}
            >
              {error}
            </div>
          )}

          {fetched.length > 0 && (
            <div className="pt-3 space-y-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <h3 className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Ready to import ({fetched.length})
              </h3>
              {fetched.map((comp) => {
                const shortName = comp.name.includes('/') ? comp.name.split('/').pop()! : comp.name;
                const fileNames = comp.resolvedFiles
                  .filter((f) => !f.path.endsWith('.css'))
                  .map((f) => f.path.split('/').pop());
                const compError = compilationErrors[shortName];
                return (
                  <div
                    key={comp.name}
                    className="rounded-lg overflow-hidden"
                    style={{
                      background: 'rgba(15, 20, 32, 0.6)',
                      border: compError
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : '1px solid var(--border-subtle)'
                    }}
                  >
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="min-w-0 flex items-center gap-2">
                        <span
                          className="text-sm"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {shortName}
                        </span>
                        <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {comp.library} &middot; {comp.resolvedFiles.length} file
                          {comp.resolvedFiles.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <button
                          onClick={() =>
                            setExpandedSource(expandedSource === comp.name ? null : comp.name)
                          }
                          className="text-xs transition-colors"
                          style={{ color: 'var(--accent-teal)' }}
                        >
                          {expandedSource === comp.name ? 'Hide' : 'Files'}
                        </button>
                        <button
                          onClick={() => handleRemove(comp.name)}
                          className="text-xs transition-colors"
                          style={{ color: 'rgb(248, 113, 113)' }}
                          aria-label={`Remove ${shortName}`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {compError && (
                      <div className="px-3 pb-2 text-xs" style={{ color: 'rgb(248, 113, 113)' }}>
                        Compilation failed: {compError}
                      </div>
                    )}
                    {expandedSource === comp.name && (
                      <div
                        className="px-3 pb-3 space-y-2"
                        style={{ borderTop: '1px solid var(--border-subtle)' }}
                      >
                        {comp.resolvedFiles.map((f) => (
                          <div key={f.path}>
                            <div
                              className="text-xs py-1 font-medium"
                              style={{
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--accent-teal)'
                              }}
                            >
                              {f.path}
                            </div>
                            <pre
                              className="text-xs overflow-auto max-h-36"
                              style={{
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              <code>{f.content}</code>
                            </pre>
                          </div>
                        ))}
                        {fileNames.length > 0 && (
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Resolved by shadcn with all dependencies
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                onClick={handleImport}
                className="btn-accent w-full text-xs px-3 py-2.5 rounded-lg font-medium"
              >
                Compile & Import {fetched.length} Component
                {fetched.length > 1 ? 's' : ''}
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
  onSelect
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
        <div className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
          Loading community registries...
        </div>
      )}

      {error && (
        <div
          className="glass-panel text-xs p-3 text-center"
          style={{
            color: 'rgb(248, 113, 113)',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)'
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && registries.length === 0 && (
        <div className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>
          {searchTerm ? `No libraries matching "${searchTerm}"` : 'No registries found'}
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
                background: 'rgba(15, 20, 32, 0.4)',
                border: '1px solid var(--border-subtle)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(15, 20, 32, 0.8)';
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 20, 32, 0.4)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {lib.name}
                </span>
                <span className="text-xs shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                  &rarr;
                </span>
              </div>
              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                {lib.description ?? ''}
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
  searchTerm,
  library,
  isFetching,
  fetchedNames,
  onFetch
}: {
  searchRef: React.RefObject<HTMLInputElement | null>;
  search: string;
  onSearchChange: (value: string) => void;
  components: SearchResultItem[];
  loading: boolean;
  searchTerm: string;
  library: CommunityRegistry;
  isFetching: string | null;
  fetchedNames: Set<string>;
  onFetch: (name: string) => void;
}) {
  const hasComponents = !loading && components.length > 0;
  const showManualEntry = !loading && components.length === 0;

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
          {library.homepage && (
            <a
              href={library.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs shrink-0 px-2 py-1.5 rounded transition-colors"
              style={{ color: 'var(--accent-teal)' }}
            >
              Docs
            </a>
          )}
        </div>
      )}

      {loading && (
        <div className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
          Loading components from {library.name}...
        </div>
      )}

      {showManualEntry && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            No index available for this registry. Type a component name to resolve it directly via
            shadcn.
          </p>
          <div className="flex gap-2">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.trim()) onFetch(search.trim());
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
              {isFetching ? 'Resolving...' : 'Resolve'}
            </button>
          </div>
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
                disabled={isAlreadyFetched || isCurrentlyFetching || isFetching !== null}
                className="btn-glass text-xs px-2.5 py-1.5 disabled:cursor-not-allowed transition-all"
                style={{
                  opacity: isAlreadyFetched ? 0.4 : 1,
                  borderColor: isAlreadyFetched ? 'rgba(34, 197, 94, 0.3)' : undefined,
                  background: isAlreadyFetched ? 'rgba(34, 197, 94, 0.08)' : undefined
                }}
                title={isAlreadyFetched ? 'Already added' : item.name}
              >
                {isCurrentlyFetching ? (
                  <span style={{ color: 'var(--accent-teal)' }}>resolving...</span>
                ) : (
                  <>
                    {isAlreadyFetched && (
                      <span style={{ color: 'rgb(34, 197, 94)', marginRight: 4 }}>✓</span>
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
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Dependencies resolved automatically via shadcn registry API.
        </p>
      )}
    </>
  );
}
