import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { searchKeymap } from "@codemirror/search";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from "@codemirror/view";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
import type { Extension } from "@codemirror/state";

export function createEditorExtensions(
  onChange: (value: string) => void,
): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    drawSelection(),
    history(),
    foldGutter(),
    bracketMatching(),
    autocompletion(),
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
      ...lintKeymap,
    ]),
    EditorView.theme({
      "&": { height: "100%", fontSize: "14px" },
      ".cm-scroller": { overflow: "auto" },
      ".cm-content": { fontFamily: "var(--font-mono)" },
      ".cm-gutters": {
        background: "rgba(11, 15, 23, 0.6)",
        borderRight: "1px solid rgba(255, 255, 255, 0.05)",
      },
      ".cm-activeLineGutter": {
        background: "rgba(249, 115, 22, 0.08)",
      },
      ".cm-activeLine": {
        background: "rgba(249, 115, 22, 0.04)",
      },
    }),
  ];
}
