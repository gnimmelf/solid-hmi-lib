import { createSignal } from 'solid-js';
import styles from './style.module.css';

export type RangeSliderValue = {
  minValue: number;
  maxValue: number;
};

type RangeSliderProps = {
  minValue: number;
  maxValue: number;
  minLimit: number;
  maxLimit: number;
  step?: number;
  precision?: number;
  unit?: string;
  formatValue?: (value: number) => string;
  formatWindow?: (value: number) => string;
  ariaLabel?: string;
  onRangeChange?: (value: RangeSliderValue) => void;
};

export default function RangeSlider(props: RangeSliderProps) {
  type DragSnapshot = {
    pointerId: number;
    startClientX: number;
    trackLeft: number;
    trackWidth: number;
    minValue: number;
    maxValue: number;
    minLimit: number;
    maxLimit: number;
    step: number;
    operation: 'window' | 'min' | 'max';
  };

  const [isDragging, setIsDragging] = createSignal(false);
  let dragSnapshot: DragSnapshot | undefined;
  let lastDragDelta: number | undefined;

  const step = () => props.step ?? 0.1;
  const precision = () => props.precision ?? 1;

  const rangePosition = (value: number) => {
    const range = props.maxLimit - props.minLimit;
    if (range <= 0) return 0;
    return Math.min(100, Math.max(0, ((value - props.minLimit) / range) * 100));
  };

  const formatValue = (value: number) =>
    props.formatValue?.(value) ?? `${value.toFixed(precision())}${props.unit ? ` ${props.unit}` : ''}`;

  const formatWindow = (value: number) =>
    props.formatWindow?.(value) ?? formatValue(value);

  const createSnapshot = (
    pointerId: number,
    startClientX: number,
    trackLeft: number,
    trackWidth: number,
    operation: DragSnapshot['operation'],
  ): DragSnapshot => ({
    pointerId,
    startClientX,
    trackLeft,
    trackWidth,
    minValue: props.minValue,
    maxValue: props.maxValue,
    minLimit: props.minLimit,
    maxLimit: props.maxLimit,
    step: step(),
    operation,
  });

  const clampDelta = (snapshot: DragSnapshot, delta: number) =>
    Math.min(snapshot.maxLimit - snapshot.maxValue, Math.max(snapshot.minLimit - snapshot.minValue, delta));

  const emitShiftedRange = (snapshot: DragSnapshot, delta: number) => {
    props.onRangeChange?.({
      minValue: Number((snapshot.minValue + delta).toPrecision(15)),
      maxValue: Number((snapshot.maxValue + delta).toPrecision(15)),
    });
  };

  const onPointerDown = (event: PointerEvent, operation: DragSnapshot['operation']) => {
    const target = event.currentTarget as HTMLElement;
    const trackRect = (operation === 'window' ? target.parentElement : target.parentElement?.parentElement)
      ?.getBoundingClientRect();
    const trackWidth = trackRect?.width ?? 0;
    const limitsSpan = props.maxLimit - props.minLimit;
    if (!event.isPrimary || event.button !== 0 || trackWidth <= 0 || limitsSpan <= 0 || step() <= 0) return;

    target.setPointerCapture(event.pointerId);
    dragSnapshot = createSnapshot(event.pointerId, event.clientX, trackRect?.left ?? 0, trackWidth, operation);
    lastDragDelta = undefined;
    setIsDragging(true);
    event.preventDefault();
  };

  const onWindowPointerDown = (event: PointerEvent) => onPointerDown(event, 'window');

  const onHandlePointerDown = (event: PointerEvent, handle: 'min' | 'max') => {
    event.stopPropagation();
    onPointerDown(event, handle);
  };

  const onPointerMove = (event: PointerEvent) => {
    const snapshot = dragSnapshot;
    if (!snapshot || event.pointerId !== snapshot.pointerId) return;

    if (snapshot.operation === 'window') {
      const limitsSpan = snapshot.maxLimit - snapshot.minLimit;
      const rawDelta = ((event.clientX - snapshot.startClientX) / snapshot.trackWidth) * limitsSpan;
      const snappedDelta = Math.round(rawDelta / snapshot.step) * snapshot.step;
      const delta = clampDelta(snapshot, snappedDelta);
      if (delta === lastDragDelta) return;

      lastDragDelta = delta;
      emitShiftedRange(snapshot, delta);
      return;
    }

    const rawValue = snapshot.minLimit + ((event.clientX - snapshot.trackLeft) / snapshot.trackWidth) *
      (snapshot.maxLimit - snapshot.minLimit);
    const snappedValue = snapshot.minLimit +
      Math.round((rawValue - snapshot.minLimit) / snapshot.step) * snapshot.step;
    const minRange = Math.min(snapshot.step, snapshot.maxLimit - snapshot.minLimit);
    const minValue = snapshot.operation === 'min'
      ? Math.min(snapshot.maxValue - minRange, Math.max(snapshot.minLimit, snappedValue))
      : snapshot.minValue;
    const maxValue = snapshot.operation === 'max'
      ? Math.max(snapshot.minValue + minRange, Math.min(snapshot.maxLimit, snappedValue))
      : snapshot.maxValue;
    const movedValue = snapshot.operation === 'min' ? minValue : maxValue;
    if (movedValue === lastDragDelta) return;

    lastDragDelta = movedValue;
    props.onRangeChange?.({ minValue, maxValue });
  };

  const onPointerEnd = (event: PointerEvent) => {
    const snapshot = dragSnapshot;
    if (!snapshot || event.pointerId !== snapshot.pointerId) return;

    dragSnapshot = undefined;
    lastDragDelta = undefined;
    setIsDragging(false);
    const target = event.currentTarget as HTMLElement;
    if (event.type !== 'lostpointercapture' && target.hasPointerCapture(snapshot.pointerId)) {
      target.releasePointerCapture(snapshot.pointerId);
    }
  };

  return (
    <div class={styles.rangeSlider}>
      <div
        class={styles.rangeWindowContent}
        style={{
          '--range-start': `${rangePosition(props.minValue)}%`,
          '--range-end': `${rangePosition(props.maxValue)}%`,
        }}
      >
        <div class={styles.barLabel}>
          <span class={styles.label}>{formatWindow(props.maxValue - props.minValue)}</span>
        </div>
        <div class={styles.rangeTrack}>
          <div
            class={{ [styles.trackBar]: true, [styles.dragging]: isDragging() && dragSnapshot?.operation === 'window' }}
            role="group"
            aria-label={props.ariaLabel ?? 'Move range window'}
            onPointerDown={onWindowPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onLostPointerCapture={onPointerEnd}
          >
            <button
              class={styles.rangeHandle}
              type="button"
              aria-label="Start of selected range"
              onPointerDown={(event) => onHandlePointerDown(event, 'min')}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onLostPointerCapture={onPointerEnd}
            />
            <button
              class={styles.rangeHandle}
              type="button"
              aria-label="End of selected range"
              onPointerDown={(event) => onHandlePointerDown(event, 'max')}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onLostPointerCapture={onPointerEnd}
            />
          </div>
        </div>
        <div class={styles.minMaxLabels}>
          <span class={styles.label}>{formatValue(props.minLimit)}</span>
          <span class={styles.label}>{formatValue(props.maxLimit)}</span>
        </div>
      </div>
    </div>
  );
}