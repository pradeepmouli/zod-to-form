import { useEffect, useRef, memo } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { createEditorExtensions } from './editor-setup.ts';

interface SchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const SchemaEditor = memo(function SchemaEditor({ value, onChange }: SchemaEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const isInternalChange = useRef(false);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: createEditorExtensions((v) => {
          isInternalChange.current = true;
          onChangeRef.current(v);
        })
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
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value }
      });
    }
  }, [value]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden" aria-label="Schema editor" />
  );
});
