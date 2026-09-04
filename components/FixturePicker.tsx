type FixtureOption = {
  id: string;
  label: string;
  text: string;
};

type FixturePickerProps = {
  fixtures: FixtureOption[];
  selectedId: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
};

export function FixturePicker({ fixtures, selectedId, disabled, onSelect }: FixturePickerProps) {
  return (
    <label className="fixture-picker">
      範例情境
      <select
        value={selectedId}
        disabled={disabled || fixtures.length === 0}
        onChange={(event) => onSelect(event.target.value)}
      >
        <option value="">自行貼上訊息</option>
        {fixtures.map((fixture) => (
          <option key={fixture.id} value={fixture.id}>
            {fixture.label}
          </option>
        ))}
      </select>
    </label>
  );
}
