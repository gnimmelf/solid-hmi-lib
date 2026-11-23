import { createSignal, createUniqueId, untrack } from "solid-js";
import RangeSlider, { type RangeSliderValue } from "../range-slider";
import styles from "./style.module.css";

export type DateTimeRangeValue = {
  minValue: Date;
  maxValue: Date;
};

type DateTimeRangeProps = {
  legend?: string;
  minValue: Date;
  maxValue: Date;
  minLimit: Date;
  maxLimit: Date;
  stepMs?: number;
  locale?: string;
  onRangeChange?: (value: DateTimeRangeValue) => void;
};

export default function DateTimeRange(props: DateTimeRangeProps) {
  const radioGroupId = createUniqueId();
  const timestamp = (date: Date) => date.getTime();
  const step = () => props.stepMs ?? 60_000;

  const createInitialViewport = () => {
    const minLimit = timestamp(props.minLimit);
    const maxLimit = timestamp(props.maxLimit);
    const selectedMin = timestamp(props.minValue);
    const selectedMax = timestamp(props.maxValue);
    const totalSpan = maxLimit - minLimit;
    const desiredSpan = Math.min(
      totalSpan,
      Math.max((selectedMax - selectedMin) * 3, totalSpan / 100, step() * 20),
    );
    const center = (selectedMin + selectedMax) / 2;
    const start = Math.min(
      maxLimit - desiredSpan,
      Math.max(minLimit, center - desiredSpan / 2),
    );
    return { minValue: start, maxValue: start + desiredSpan };
  };

  const [viewport, setViewport] = createSignal(untrack(createInitialViewport));
  const [overviewMode, setOverviewMode] = createSignal<"lock" | "push">("lock");

  const setZoom = (value: number) => {
    const minLimit = timestamp(props.minLimit);
    const maxLimit = timestamp(props.maxLimit);
    const selectedMin = timestamp(props.minValue);
    const selectedMax = timestamp(props.maxValue);
    const totalSpan = maxLimit - minLimit;
    const minimumSpan = Math.min(
      totalSpan,
      Math.max(selectedMax - selectedMin, step() * 2),
    );
    const zoomFraction = Math.min(1, Math.max(0, value / 100));
    const nextSpan =
      totalSpan * Math.pow(minimumSpan / totalSpan, zoomFraction);
    const center = (selectedMin + selectedMax) / 2;
    const start = Math.min(
      maxLimit - nextSpan,
      Math.max(minLimit, center - nextSpan / 2),
    );
    setViewport({ minValue: start, maxValue: start + nextSpan });
  };

  const totalSpan = () => timestamp(props.maxLimit) - timestamp(props.minLimit);
  const viewportSpan = () => viewport().maxValue - viewport().minValue;
  const selectedSpan = () =>
    timestamp(props.maxValue) - timestamp(props.minValue);
  const minimumViewportSpan = () =>
    Math.min(totalSpan(), Math.max(selectedSpan(), step() * 2));
  const zoomLevel = () => {
    const total = totalSpan();
    const minimum = minimumViewportSpan();
    if (total <= minimum || viewportSpan() >= total) return 0;
    return Math.round(
      (100 * Math.log(total / viewportSpan())) / Math.log(total / minimum),
    );
  };

  const normalizeViewport = (
    range: RangeSliderValue,
    selectedMin: number,
    selectedMax: number,
  ) => {
    const minLimit = timestamp(props.minLimit);
    const maxLimit = timestamp(props.maxLimit);
    const total = maxLimit - minLimit;
    const minSpan = Math.min(
      total,
      Math.max(selectedMax - selectedMin, step() * 2),
    );
    const span = Math.min(
      total,
      Math.max(minSpan, range.maxValue - range.minValue),
    );
    let minValue = Math.min(
      maxLimit - span,
      Math.max(minLimit, range.minValue),
    );

    if (minValue > selectedMin) minValue = selectedMin;
    if (minValue + span < selectedMax) minValue = selectedMax - span;
    minValue = Math.min(maxLimit - span, Math.max(minLimit, minValue));

    return { minValue, maxValue: minValue + span };
  };

  const handleOverviewRangeChange = (range: RangeSliderValue) => {
    const currentViewport = viewport();
    const currentSpan = currentViewport.maxValue - currentViewport.minValue;
    const nextSpan = range.maxValue - range.minValue;
    const isPan = Math.abs(nextSpan - currentSpan) <= Math.max(step() / 2, 1);
    const selectedMin = timestamp(props.minValue);
    const selectedMax = timestamp(props.maxValue);

    if (overviewMode() === "push" && !isPan) {
      const selectedDuration = selectedMax - selectedMin;
      const minimumSpan = Math.max(selectedDuration, step() * 2);
      const isMinHandleResize = range.maxValue === currentViewport.maxValue;
      const isMaxHandleResize = range.minValue === currentViewport.minValue;

      if (isMinHandleResize) {
        const nextMax = currentViewport.maxValue;
        const minLimit = timestamp(props.minLimit);
        const span = Math.min(
          nextMax - minLimit,
          Math.max(minimumSpan, nextSpan),
        );
        const nextMin = Math.min(
          nextMax - span,
          Math.max(minLimit, range.minValue),
        );
        const nextSelectedMin = Math.min(
          nextMax - selectedDuration,
          Math.max(nextMin, selectedMin),
        );

        if (nextSelectedMin !== selectedMin) {
          props.onRangeChange?.({
            minValue: new Date(nextSelectedMin),
            maxValue: new Date(nextSelectedMin + selectedDuration),
          });
        }
        setViewport({ minValue: nextMin, maxValue: nextMax });
        return;
      }

      if (isMaxHandleResize) {
        const nextMin = currentViewport.minValue;
        const maxLimit = timestamp(props.maxLimit);
        const span = Math.min(
          maxLimit - nextMin,
          Math.max(minimumSpan, nextSpan),
        );
        const nextMax = Math.max(
          nextMin + span,
          Math.min(maxLimit, range.maxValue),
        );
        const nextSelectedMin = Math.min(
          nextMax - selectedDuration,
          Math.max(nextMin, selectedMin),
        );

        if (nextSelectedMin !== selectedMin) {
          props.onRangeChange?.({
            minValue: new Date(nextSelectedMin),
            maxValue: new Date(nextSelectedMin + selectedDuration),
          });
        }
        setViewport({ minValue: nextMin, maxValue: nextMax });
        return;
      }
    }

    if (overviewMode() === "lock" && !isPan) {
      const isMinHandleResize = range.maxValue === currentViewport.maxValue;
      const isMaxHandleResize = range.minValue === currentViewport.minValue;

      if (isMinHandleResize) {
        setViewport({
          minValue: Math.min(range.minValue, selectedMin),
          maxValue: currentViewport.maxValue,
        });
        return;
      }

      if (isMaxHandleResize) {
        setViewport({
          minValue: currentViewport.minValue,
          maxValue: Math.max(range.maxValue, selectedMax),
        });
        return;
      }
    }

    if (overviewMode() === "push" && isPan) {
      const selectedDuration = selectedMax - selectedMin;
      const nextSelectedMin = Math.min(
        range.maxValue - selectedDuration,
        Math.max(range.minValue, selectedMin),
      );
      if (nextSelectedMin !== selectedMin) {
        props.onRangeChange?.({
          minValue: new Date(nextSelectedMin),
          maxValue: new Date(nextSelectedMin + selectedDuration),
        });
      }

      setViewport(range);
      return;
    }

    setViewport(
      normalizeViewport(range, selectedMin, selectedMax),
    );
  };

  const dateFormatter = () =>
    new Intl.DateTimeFormat(props.locale, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  const formatDateTime = (value: number) => dateFormatter().format(value);

  const formatDuration = (durationMs: number) => {
    const yearMs = 365 * 24 * 60 * 60 * 1_000;
    const monthMs = 30 * 24 * 60 * 60 * 1_000;
    const totalMinutes = Math.round(durationMs / 60_000);
    const years = Math.floor((totalMinutes * 60_000) / yearMs);
    const afterYearsMs = totalMinutes * 60_000 - years * yearMs;
    const months = Math.floor(afterYearsMs / monthMs);
    const afterMonthsMs = afterYearsMs - months * monthMs;
    const remainingMinutes = Math.floor(afterMonthsMs / 60_000);
    const days = Math.floor(remainingMinutes / 1_440);
    const hours = Math.floor((remainingMinutes % 1_440) / 60);
    const minutes = remainingMinutes % 60;
    const parts = [
      years > 0 ? `${years}y` : "",
      months > 0 ? `${months}mo` : "",
      days > 0 ? `${days}d` : "",
      hours > 0 ? `${hours}h` : "",
      minutes > 0 ? `${minutes}m` : "",
    ].filter(Boolean);
    return parts.join(" ") || "< 1m";
  };

  const handleRangeChange = (range: RangeSliderValue) => {
    props.onRangeChange?.({
      minValue: new Date(range.minValue),
      maxValue: new Date(range.maxValue),
    });
  };

  return (
    <fieldset class={styles.dateTimeRange}>
      <legend>{props.legend ?? "Date and time range"}</legend>
      <fieldset class={styles.overviewOptions}>
        <legend>Overview behavior</legend>
        <label>
          <input
            type="radio"
            name={radioGroupId}
            value="lock"
            checked={overviewMode() === "lock"}
            onChange={() => setOverviewMode("lock")}
          />
          Lock Details
        </label>
        <label>
          <input
            type="radio"
            name={radioGroupId}
            value="push"
            checked={overviewMode() === "push"}
            onChange={() => setOverviewMode("push")}
          />
          Push details
        </label>
        <label>
          Zoom
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={zoomLevel()}
            aria-label="Zoom detail range"
            onInput={(event) => setZoom(Number(event.currentTarget.value))}
          />
        </label>
      </fieldset>

      <p>Overview · full available range</p>
      <RangeSlider
        minValue={viewport().minValue}
        maxValue={viewport().maxValue}
        minLimit={timestamp(props.minLimit)}
        maxLimit={timestamp(props.maxLimit)}
        step={step()}
        precision={0}
        formatValue={formatDateTime}
        formatWindow={formatDuration}
        ariaLabel="Pan or resize the visible detail range"
        onRangeChange={handleOverviewRangeChange}
      />

      <p>Detail</p>
      <RangeSlider
        minValue={timestamp(props.minValue)}
        maxValue={timestamp(props.maxValue)}
        minLimit={viewport().minValue}
        maxLimit={viewport().maxValue}
        step={step()}
        precision={0}
        formatValue={formatDateTime}
        formatWindow={formatDuration}
        ariaLabel="Adjust selected date and time range in the detail view"
        onRangeChange={handleRangeChange}
      />

      <output class={styles.selection} aria-live="polite">
        <span>Selected range</span>
        <strong>
          {formatDateTime(timestamp(props.minValue))} –{" "}
          {formatDateTime(timestamp(props.maxValue))}
        </strong>
      </output>
    </fieldset>
  );
}
