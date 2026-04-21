import { type ReactNode, useCallback, useRef, useState } from 'react';
import type { ActiveTab, ActivePane, PaneSizes } from '../../types/playground.ts';
import { MIN_PANE_PCT, MAX_PANE_PCT } from '../../types/playground.ts';
import { useMediaQuery } from '../../hooks/useMediaQuery.ts';
import { ResizeHandle } from './ResizeHandle.tsx';
import { PanelHeader } from './PanelHeader.tsx';

interface PlaygroundShellProps {
  editor: ReactNode;
  configPane: ReactNode;
  preview: ReactNode;
  inspect: ReactNode;
  codeOutput: ReactNode;
  activeTab: ActiveTab;
  activePane: ActivePane;
  paneSizes: PaneSizes;
  onTabChange: (tab: ActiveTab) => void;
  onPaneChange: (pane: ActivePane) => void;
  onPaneSizesChange: (sizes: PaneSizes) => void;
}

const OUTPUT_TABS: { id: ActiveTab; label: string }[] = [
  { id: 'preview', label: 'Preview' },
  { id: 'inspect', label: 'Inspect' }
];

type MobileTab = 'schema' | 'config' | 'preview' | 'inspect' | 'code';

const MOBILE_TABS: { id: MobileTab; label: string }[] = [
  { id: 'schema', label: 'Schema' },
  { id: 'config', label: 'Config' },
  { id: 'preview', label: 'Preview' },
  { id: 'inspect', label: 'Inspect' },
  { id: 'code', label: 'Code' }
];

export function PlaygroundShell({
  editor,
  configPane,
  preview,
  inspect,
  codeOutput,
  activeTab,
  activePane,
  paneSizes,
  onTabChange,
  onPaneChange,
  onPaneSizesChange
}: PlaygroundShellProps) {
  const isWide = useMediaQuery('(min-width: 768px)');

  const outputTabBar = (
    <PanelHeader label="Preview" accent="pink">
      <div className="flex gap-1" role="tablist" aria-label="Output view">
        {OUTPUT_TABS.map((tab) => (
          <button
            key={tab.id}
            id={`output-tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`output-tabpanel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`tab px-2.5 py-1 text-[13px] font-medium ${
              activeTab === tab.id ? 'tab-active' : ''
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </PanelHeader>
  );

  const getOutputContent = () => {
    switch (activeTab) {
      case 'preview':
        return preview;
      case 'inspect':
        return inspect;
      default:
        return preview;
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const paneSizesRef = useRef(paneSizes);
  paneSizesRef.current = paneSizes;

  const clamp = (v: number) => Math.max(MIN_PANE_PCT, Math.min(MAX_PANE_PCT, v));

  const makeResizeHandler = useCallback(
    (dimension: 'clientWidth' | 'clientHeight', sizeKey: keyof PaneSizes) => (delta: number) => {
      const el = containerRef.current;
      if (!el) return;
      const pct = (delta / el[dimension]) * 100;
      const sizes = paneSizesRef.current;
      onPaneSizesChange({ ...sizes, [sizeKey]: clamp(sizes[sizeKey] + pct) });
    },
    [onPaneSizesChange]
  );

  const handleVerticalResize = makeResizeHandler('clientWidth', 'verticalSplit');
  const handleLeftHorizontalResize = makeResizeHandler('clientHeight', 'leftHorizontalSplit');
  const handleRightHorizontalResize = makeResizeHandler('clientHeight', 'rightHorizontalSplit');

  // Wide layout: four quadrants with resizable dividers
  if (isWide) {
    const { verticalSplit, leftHorizontalSplit, rightHorizontalSplit } = paneSizes;

    return (
      <div className="flex-1 flex min-h-0" ref={containerRef}>
        {/* Left column */}
        <div className="flex flex-col min-h-0 min-w-0" style={{ width: `${verticalSplit}%` }}>
          {/* Top-left: Schema Editor */}
          <div
            className="flex flex-col min-h-0"
            style={{ height: `${leftHorizontalSplit}%` }}
            role="region"
            aria-label="Schema editor"
          >
            <PanelHeader label="Schema" accent="teal" caption="zod" />
            <div className="flex-1 min-h-0 overflow-auto">{editor}</div>
          </div>
          <ResizeHandle
            orientation="horizontal"
            onResize={handleLeftHorizontalResize}
            value={leftHorizontalSplit}
          />
          {/* Bottom-left: Config Editor */}
          <div
            className="min-h-0 overflow-auto flex-1 flex flex-col"
            role="region"
            aria-label="Configuration editor"
          >
            {configPane}
          </div>
        </div>

        <ResizeHandle
          orientation="vertical"
          onResize={handleVerticalResize}
          value={verticalSplit}
        />

        {/* Right column */}
        <div className="flex flex-col min-h-0 min-w-0 flex-1 glass-surface">
          {/* Top-right: Preview / Inspect (tabbed) */}
          <div
            className="flex flex-col min-h-0"
            style={{ height: `${rightHorizontalSplit}%` }}
            role="region"
            aria-label="Preview and inspect"
          >
            {outputTabBar}
            <div
              id={`output-tabpanel-${activeTab}`}
              className="flex-1 min-h-0 overflow-auto"
              role="tabpanel"
              aria-labelledby={`output-tab-${activeTab}`}
            >
              {getOutputContent()}
            </div>
          </div>
          <ResizeHandle
            orientation="horizontal"
            onResize={handleRightHorizontalResize}
            value={rightHorizontalSplit}
          />
          {/* Bottom-right: Code Output */}
          <div className="min-h-0 overflow-auto flex-1" role="region" aria-label="Code output">
            {codeOutput}
          </div>
        </div>
      </div>
    );
  }

  // Narrow layout: tabbed navigation with all sections
  // Track mobile-only tabs ('config', 'code') separately so they don't corrupt
  // desktop's activeTab state when the viewport is resized to wide.
  const [mobileOnlyTab, setMobileOnlyTab] = useState<'config' | 'code' | null>(null);

  const mobileTab: MobileTab =
    mobileOnlyTab ?? (activePane === 'editor' ? 'schema' : (activeTab as MobileTab));

  const handleMobileTabChange = (tab: MobileTab) => {
    if (tab === 'schema') {
      setMobileOnlyTab(null);
      onPaneChange('editor');
      return;
    }
    onPaneChange('preview');
    if (tab === 'config' || tab === 'code') {
      setMobileOnlyTab(tab);
    } else {
      setMobileOnlyTab(null);
      onTabChange(tab);
    }
  };

  const getMobileContent = (): ReactNode => {
    switch (mobileTab) {
      case 'schema':
        return editor;
      case 'config':
        return configPane;
      case 'preview':
        return preview;
      case 'inspect':
        return inspect;
      case 'code':
        return codeOutput;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        className="flex gap-1 px-3 py-2 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
        role="tablist"
        aria-label="Section selector"
      >
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            id={`mobile-tab-${tab.id}`}
            role="tab"
            aria-selected={mobileTab === tab.id}
            aria-controls="mobile-tabpanel"
            onClick={() => handleMobileTabChange(tab.id)}
            className={`tab px-3 py-1.5 text-[13px] font-medium whitespace-nowrap ${
              mobileTab === tab.id ? 'tab-active' : ''
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id="mobile-tabpanel"
        className="flex-1 min-h-0 overflow-auto"
        role="tabpanel"
        aria-labelledby={`mobile-tab-${mobileTab}`}
      >
        {getMobileContent()}
      </div>
    </div>
  );
}
