import { useEffect, useRef, memo } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { createReadOnlyViewerExtensions } from '../editor/editor-setup.ts';

interface CodeViewerProps {
  value: string;
  ariaLabel?: string;
}

/**
 * Read-only CodeMirror view used to display generated code with
 * syntax highlighting. Reuses the same theme/language as the
 * editable editors in the playground.
 */
export const CodeViewer = memo(function CodeViewer({
  value,
  ariaLabel = 'Generated code'
}: CodeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: createReadOnlyViewerExtensions()
      }),
      parent: containerRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value }
      });
    }
  }, [value]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden" aria-label={ariaLabel} />
  );
});
