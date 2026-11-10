import { Title } from '@solidjs/meta';
import { createSignal } from 'solid-js';
import RangeSlider, {
  type RangeSliderValue,
} from '../../components/range-slider';

export default function RangeSliderPage() {
  const [selection, setSelection] = createSignal<RangeSliderValue>({ minValue: 8, maxValue: 16 });

  const handleRangeChange = (range: RangeSliderValue) => setSelection(range);

  return (
    <main>
      <Title>Date and Time Range</Title>
      <h1>Date and time range</h1>
      <p>Drag the highlighted window to choose a time of day.</p>
      <RangeSlider
        legend="Selected time window"
        minValue={selection().minValue}
        maxValue={selection().maxValue}
        minLimit={0}
        maxLimit={24}
        step={0.25}
        precision={2}
        unit="hours"
        ariaLabel="Move selected time window through the day"
        onRangeChange={handleRangeChange}
      />
      <p aria-live="polite">
        Selected window: {selection().minValue.toFixed(2)}–{selection().maxValue.toFixed(2)} hours
        {' · '}Duration: {(selection().maxValue - selection().minValue).toFixed(2)} hours
      </p>
    </main>
  );
}