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

const DEMO_FIXTURE_IDS = [
  "verbal-bullying",
  "unpaid-overtime",
  "unreasonable-transfer",
  "forced-resignation",
  "firm-performance-feedback",
] as const;

function options(fixtures: FixtureOption[], ids: readonly string[]) {
  const byId = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  return ids.flatMap((id) => {
    const fixture = byId.get(id);
    return fixture ? [fixture] : [];
  });
}

export function FixturePicker({ fixtures, selectedId, disabled, onSelect }: FixturePickerProps) {
  const demoIds = new Set<string>(DEMO_FIXTURE_IDS);
  const demo = options(fixtures, DEMO_FIXTURE_IDS);
  const more = fixtures.filter((fixture) => !demoIds.has(fixture.id));

  return (
    <label className="fixture-picker">
      範例情境
      <select
        value={selectedId}
        disabled={disabled || fixtures.length === 0}
        onChange={(event) => onSelect(event.target.value)}
      >
        <option value="">自行貼上訊息</option>
        <optgroup label="評審展示">
          {demo.map((fixture) => (
            <option key={fixture.id} value={fixture.id}>
              {fixture.label}
            </option>
          ))}
        </optgroup>
        {more.length > 0 && (
          <optgroup label="其他情境">
            {more.map((fixture) => (
              <option key={fixture.id} value={fixture.id}>
                {fixture.label}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </label>
  );
}
