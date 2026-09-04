type FixtureOption = {
  id: string;
  label: string;
  text: string;
};

type FixturePickerProps = {
  fixtures: FixtureOption[];
  onSelect: (fixture: FixtureOption | null) => void;
};

export function FixturePicker({ fixtures, onSelect }: FixturePickerProps) {
  return (
    <label className="fixture-picker">
      範例情境
      <select
        defaultValue=""
        disabled={fixtures.length === 0}
        onChange={(event) => {
          const fixture =
            fixtures.find((item) => item.id === event.target.value) ?? null;
          onSelect(fixture);
        }}
      >
        <option value="">
          {fixtures.length === 0 ? "範例情境準備中" : "選擇一個範例情境"}
        </option>
        {fixtures.map((fixture) => (
          <option key={fixture.id} value={fixture.id}>
            {fixture.label}
          </option>
        ))}
      </select>
    </label>
  );
}
