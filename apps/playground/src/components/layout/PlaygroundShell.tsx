import { type ReactNode } from "react";
import type { ActiveTab, ActivePane } from "../../types/playground.ts";
import { useMediaQuery } from "../../hooks/useMediaQuery.ts";

interface PlaygroundShellProps {
  editor: ReactNode;
  preview: ReactNode;
  inspect: ReactNode;
  activeTab: ActiveTab;
  activePane: ActivePane;
  onTabChange: (tab: ActiveTab) => void;
  onPaneChange: (pane: ActivePane) => void;
}

export function PlaygroundShell({
  editor,
  preview,
  inspect,
  activeTab,
  activePane,
  onTabChange,
  onPaneChange,
}: PlaygroundShellProps) {
  const isWide = useMediaQuery("(min-width: 768px)");

  const tabBar = (
    <div className="flex border-b border-zinc-800" role="tablist" aria-label="Output view">
      <button
        role="tab"
        aria-selected={activeTab === "preview"}
        onClick={() => onTabChange("preview")}
        className={`px-4 py-2 text-xs font-medium transition-colors ${
          activeTab === "preview"
            ? "text-violet-400 border-b-2 border-violet-400"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        Preview
      </button>
      <button
        role="tab"
        aria-selected={activeTab === "inspect"}
        onClick={() => onTabChange("inspect")}
        className={`px-4 py-2 text-xs font-medium transition-colors ${
          activeTab === "inspect"
            ? "text-violet-400 border-b-2 border-violet-400"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        Inspect
      </button>
    </div>
  );

  const tabContent = (
    <div className="flex-1 min-h-0 overflow-auto" role="tabpanel">
      {activeTab === "preview" ? preview : inspect}
    </div>
  );

  if (isWide) {
    return (
      <div className="flex-1 grid grid-cols-2 min-h-0">
        <div
          className="border-r border-zinc-800 min-h-0 overflow-hidden"
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
      <div className="flex border-b border-zinc-800" role="tablist" aria-label="Pane selector">
        <button
          role="tab"
          aria-selected={activePane === "editor"}
          onClick={() => onPaneChange("editor")}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
            activePane === "editor"
              ? "text-violet-400 border-b-2 border-violet-400"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Editor
        </button>
        <button
          role="tab"
          aria-selected={activePane === "preview"}
          onClick={() => onPaneChange("preview")}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
            activePane === "preview"
              ? "text-violet-400 border-b-2 border-violet-400"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Preview
        </button>
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
