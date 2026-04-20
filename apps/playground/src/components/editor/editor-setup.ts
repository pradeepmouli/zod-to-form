import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection
} from '@codemirror/view';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldGutter,
  foldKeymap
} from '@codemirror/language';
import { EditorState, type Extension } from '@codemirror/state';

const sharedTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px' },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-content': { fontFamily: 'var(--font-mono)' },
  '.cm-gutters': {
    background: 'rgba(11, 15, 23, 0.6)',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)'
  },
  '.cm-activeLineGutter': {
    background: 'rgba(249, 115, 22, 0.08)'
  },
  '.cm-activeLine': {
    background: 'rgba(249, 115, 22, 0.04)'
  }
});

function baseExtensions(onChange: (value: string) => void): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    drawSelection(),
    history(),
    foldGutter(),
    bracketMatching(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    javascript({ typescript: true }),
    oneDark,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    }),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      ...completionKeymap,
      ...foldKeymap,
      ...lintKeymap
    ]),
    sharedTheme
  ];
}

export function createEditorExtensions(onChange: (value: string) => void): Extension[] {
  return [...baseExtensions(onChange), autocompletion()];
}

export function createConfigEditorExtensions(
  onChange: (value: string) => void,
  completionSource: (ctx: CompletionContext) => CompletionResult | null
): Extension[] {
  return [...baseExtensions(onChange), autocompletion({ override: [completionSource] })];
}

/**
 * Extensions for a read-only code viewer (generated code preview).
 * Reuses the same theme and language highlighting as the editable editors,
 * but omits history/keymap/autocomplete and disables edits.
 */
export function createReadOnlyViewerExtensions(): Extension[] {
  return [
    lineNumbers(),
    foldGutter(),
    drawSelection(),
    bracketMatching(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    javascript({ typescript: true, jsx: true }),
    oneDark,
    EditorView.editable.of(false),
    EditorState.readOnly.of(true),
    keymap.of([...defaultKeymap, ...searchKeymap, ...foldKeymap]),
    sharedTheme
  ];
}
