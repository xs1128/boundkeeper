type FixtureOption = {
  id: string;
  label: string;
  text: string;
};

type FixturePickerProps = {
  fixtures: FixtureOption[];
  onSelect: (text: string) => void;
};

export function FixturePicker({ fixtures, onSelect }: FixturePickerProps) {
  return (
    <label>
      Demo 情境
      <select
        defaultValue=""
        disabled={fixtures.length === 0}
        onChange={(event) => onSelect(event.target.value)}
      >
        <option value="">尚未加入 fixtures</option>
        {fixtures.map((fixture) => (
          <option key={fixture.id} value={fixture.text}>
            {fixture.label}
          </option>
        ))}
      </select>
    </label>
  );
}
