/**
 * Contract: Extended PlaygroundState for studio layout redesign.
 *
 * These types extend the existing PlaygroundState with new fields
 * for the four-quadrant layout, config pane tabs, code output modes,
 * and resizable pane proportions.
 */

// --- New discriminants ---

/** Config pane sub-tab selector */
export type ConfigTab = 'form' | 'ts';

/** Code output pane mode selector */
export type CodeOutputMode = 'react' | 'cli';

/** Pane proportion state for resizable quadrants (percentages 0-100) */
export interface PaneSizes {
  /** Left/right column split (% allocated to left column) */
  verticalSplit: number;
  /** Schema editor / config pane split in left column (% allocated to top) */
  leftHorizontalSplit: number;
  /** Preview / code output split in right column (% allocated to top) */
  rightHorizontalSplit: number;
}

export const DEFAULT_PANE_SIZES: PaneSizes = {
  verticalSplit: 50,
  leftHorizontalSplit: 50,
  rightHorizontalSplit: 50
};

// --- Extended state (additions to existing PlaygroundState) ---

export interface PlaygroundStateExtension {
  /** Active config pane sub-tab */
  configTab: ConfigTab;
  /** Active code output mode */
  codeOutputMode: CodeOutputMode;
  /** Resizable pane proportions */
  paneSizes: PaneSizes;
}
