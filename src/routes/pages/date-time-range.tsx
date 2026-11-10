import { Title } from '@solidjs/meta';
import { createSignal } from 'solid-js';
import DateTimeRange, { type DateTimeRangeValue } from '../../components/date-time-range';

const minLimit = new Date('2000-11-01T00:00:00.000Z');
const maxLimit = new Date('2026-11-30T23:59:00.000Z');

export default function DateTimeRangePage() {
  const [selection, setSelection] = createSignal<DateTimeRangeValue>({
    minValue: new Date('2014-11-10T08:00:00.000Z'),
    maxValue: new Date('2020-11-12T16:00:00.000Z'),
  });

  const handleRangeChange = (range: DateTimeRangeValue) => setSelection(range);

  return (
    <main>
      <Title>Date and Time Range</Title>
      <h1>Date and time range</h1>
      <p>Use the detail slider to edit the selection and the overview slider to pan or resize the visible range.</p>
      <DateTimeRange
        legend="Selected date-time range"
        minValue={selection().minValue}
        maxValue={selection().maxValue}
        minLimit={minLimit}
        maxLimit={maxLimit}
        stepMs={15 * 60_000}
        locale="en-GB"
        onRangeChange={handleRangeChange}
      />
    </main>
  );
}