import { type ReactNode } from "react";
import type { ActiveTab, ActivePane } from "../../types/playground.ts";
import { useMediaQuery } from "../../hooks/useMediaQuery.ts";

interface PlaygroundShellProps {
  editor: ReactNode;
  preview: ReactNode;
  inspect: ReactNode;
  codeOutput: ReactNode;
  activeTab: ActiveTab;
  activePane: ActivePane;
  onTabChange: (tab: ActiveTab) => void;
  onPaneChange: (pane: ActivePane) => void;
}

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "code", label: "Code" },
  { id: "inspect", label: "Inspect" },
];

export function PlaygroundShell({
  editor,
  preview,
  inspect,
  codeOutput,
  activeTab,
  activePane,
  onTabChange,
  onPaneChange,
}: PlaygroundShellProps) {
  const isWide = useMediaQuery("(min-width: 768px)");

  const tabBar = (
    <div
      className="flex"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
      role="tablist"
      aria-label="Output view"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className="px-4 py-2.5 text-xs font-medium transition-colors"
          style={{
            color:
              activeTab === tab.id
                ? "var(--accent-violet)"
                : "var(--text-muted)",
            borderBottom:
              activeTab === tab.id
                ? "2px solid var(--accent-violet)"
                : "2px solid transparent",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const getTabContent = () => {
    switch (activeTab) {
      case "preview":
        return preview;
      case "code":
        return codeOutput;
      case "inspect":
        return inspect;
    }
  };

  const tabContent = (
    <div className="flex-1 min-h-0 overflow-auto" role="tabpanel">
      {getTabContent()}
    </div>
  );

  if (isWide) {
    return (
      <div className="flex-1 grid grid-cols-2 min-h-0">
        <div
          className="min-h-0 overflow-hidden"
          style={{ borderRight: "1px solid var(--border-subtle)" }}
          role="region"
          aria-label="Schema editor"
        >
          {editor}
        </div>
        <div className="flex flex-col min-h-0" role="region" aria-label="Output">
          {tabBar}
          {tabContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        className="flex"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
        role="tablist"
        aria-label="Pane selector"
      >
        {(["editor", "preview"] as const).map((pane) => (
          <button
            key={pane}
            role="tab"
            aria-selected={activePane === pane}
            onClick={() => onPaneChange(pane)}
            className="flex-1 px-4 py-2.5 text-xs font-medium transition-colors"
            style={{
              color:
                activePane === pane
                  ? "var(--accent-violet)"
                  : "var(--text-muted)",
              borderBottom:
                activePane === pane
                  ? "2px solid var(--accent-violet)"
                  : "2px solid transparent",
            }}
          >
            {pane === "editor" ? "Editor" : "Preview"}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-auto" role="tabpanel">
        {activePane === "editor" ? (
          editor
        ) : (
          <div className="flex flex-col h-full">
            {tabBar}
            {tabContent}
          </div>
        )}
      </div>
    </div>
  );
}
