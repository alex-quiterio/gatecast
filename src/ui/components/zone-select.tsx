import { groupTimeZones, listTimeZones } from '@/places';

/** Props of {@link ZoneSelect}. */
export interface ZoneSelectProps {
  id: string;
  label: string;
  /** Current IANA zone. Shown even when it is not in the browser's list. */
  value: string;
  onChange: (timeZone: string) => void;
}

/** Native time zone picker with one `<optgroup>` per region. */
export function ZoneSelect({ id, label, value, onChange }: ZoneSelectProps) {
  const zones = listTimeZones();
  const known = value === '' || zones.includes(value);
  const groups = groupTimeZones(zones);
  return (
    <div class="zs">
      <label class="zs-label" for={id}>
        {label}
      </label>
      <select
        id={id}
        class="zs-select"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
      >
        {value === '' && <option value="">Choose a time zone…</option>}
        {!known && <option value={value}>{value}</option>}
        {Object.entries(groups).map(([region, list]) => (
          <optgroup key={region} label={region}>
            {list.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replaceAll('_', ' ')}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
