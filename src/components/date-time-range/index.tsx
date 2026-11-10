import RangeSlider, { type RangeSliderValue } from '../range-slider';
import styles from './style.module.css';

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
  const timestamp = (date: Date) => date.getTime();
  const dateFormatter = () =>
    new Intl.DateTimeFormat(props.locale, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
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
      years > 0 ? `${years}y` : '',
      months > 0 ? `${months}mo` : '',
      days > 0 ? `${days}d` : '',
    ].filter(Boolean);
    return parts.join(' ') || '< 1m';
  };

  const handleRangeChange = (range: RangeSliderValue) => {
    props.onRangeChange?.({
      minValue: new Date(range.minValue),
      maxValue: new Date(range.maxValue),
    });
  };

  return (
    <fieldset class={styles.dateTimeRange}>
      <legend>{props.legend ?? 'Date and time range'}</legend>
      <RangeSlider
        minValue={timestamp(props.minValue)}
        maxValue={timestamp(props.maxValue)}
        minLimit={timestamp(props.minLimit)}
        maxLimit={timestamp(props.maxLimit)}
        step={props.stepMs ?? 60_000}
        precision={0}
        formatValue={formatDateTime}
        formatWindow={formatDuration}
        ariaLabel="Move selected date and time range"
        onRangeChange={handleRangeChange}
      />
      <output class={styles.selection} aria-live="polite">
        <span>Selected range</span>
        <strong>
          {formatDateTime(timestamp(props.minValue))} – {formatDateTime(timestamp(props.maxValue))}
        </strong>
      </output>
    </fieldset>
  );
}
