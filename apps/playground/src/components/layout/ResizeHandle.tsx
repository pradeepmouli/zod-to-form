import { useCallback, useRef } from 'react';

interface ResizeHandleProps {
  orientation: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  value?: number;
}

const KEYBOARD_STEP = 20;

const MIN_PANE_PCT = 15;
const MAX_PANE_PCT = 85;

export function ResizeHandle({ orientation, onResize, value }: ResizeHandleProps) {
  const dragging = useRef(false);
  const lastPos = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      lastPos.current = orientation === 'vertical' ? e.clientX : e.clientY;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [orientation]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const currentPos = orientation === 'vertical' ? e.clientX : e.clientY;
      const delta = currentPos - lastPos.current;
      lastPos.current = currentPos;
      onResize(delta);
    },
    [orientation, onResize]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isVertical = orientation === 'vertical';
      let delta = 0;
      if (isVertical && e.key === 'ArrowRight') delta = KEYBOARD_STEP;
      else if (isVertical && e.key === 'ArrowLeft') delta = -KEYBOARD_STEP;
      else if (!isVertical && e.key === 'ArrowDown') delta = KEYBOARD_STEP;
      else if (!isVertical && e.key === 'ArrowUp') delta = -KEYBOARD_STEP;
      if (delta !== 0) {
        e.preventDefault();
        onResize(delta);
      }
    },
    [orientation, onResize]
  );

  const isVertical = orientation === 'vertical';

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      style={{
        cursor: isVertical ? 'col-resize' : 'row-resize',
        [isVertical ? 'width' : 'height']: '6px',
        [isVertical ? 'height' : 'width']: '100%',
        background: 'transparent',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0
      }}
      role="separator"
      aria-orientation={orientation}
      aria-valuenow={value != null ? Math.round(value) : undefined}
      aria-valuemin={MIN_PANE_PCT}
      aria-valuemax={MAX_PANE_PCT}
      tabIndex={0}
      aria-label={`Resize ${orientation === 'vertical' ? 'columns' : 'rows'}`}
    >
      <div
        style={{
          position: 'absolute',
          [isVertical ? 'left' : 'top']: '2px',
          [isVertical ? 'width' : 'height']: '2px',
          [isVertical ? 'height' : 'width']: '100%',
          background: 'var(--border-subtle)',
          borderRadius: '1px',
          transition: 'background 0.15s'
        }}
      />
    </div>
  );
}
