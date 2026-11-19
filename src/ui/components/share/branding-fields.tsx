import type { VNode } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { downscaleLogo, logoFileProblem } from '@ui/share/logo';
import { MAX_FIELD } from '@ui/share/prefs';
import type { SharePrefs } from '@ui/share/types';
import { Group, TextField, Toggle } from './controls';

/** Props of {@link BrandingFields}. */
export interface BrandingFieldsProps {
  prefs: SharePrefs;
  update: (patch: Partial<SharePrefs>) => void;
  /** Label of the display-name field ("Name on the card" or "Prepared for"). */
  nameLabel?: string;
  /** Hide the display-name field (comparisons use both names). */
  hideName?: boolean;
}

/** "Prepared by", contact line, logo and watermark: shared by the card and the report. */
export function BrandingFields({ prefs, update, nameLabel, hideName }: BrandingFieldsProps): VNode {
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const onFile = async (e: Event): Promise<void> => {
    const el = e.currentTarget as HTMLInputElement;
    const file = el.files?.[0];
    if (!file) return;
    const problem = logoFileProblem(file);
    if (problem) {
      setError(problem);
    } else {
      const result = await downscaleLogo(file);
      if (result.ok) {
        setError('');
        update({ logo: result.dataUrl });
      } else setError(result.error);
    }
    el.value = '';
  };
  return (
    <Group title="Your branding">
      {hideName ? null : (
        <TextField
          label={nameLabel ?? 'Display name'}
          value={prefs.displayName}
          onChange={(displayName) => update({ displayName })}
          maxLength={MAX_FIELD}
          placeholder="Use the chart's name"
          hint="Shown instead of the name saved with the chart. Never stored in the link."
        />
      )}
      <TextField
        label="Prepared by"
        value={prefs.preparedBy}
        onChange={(preparedBy) => update({ preparedBy })}
        maxLength={MAX_FIELD}
        placeholder="Your name or practice"
        autoComplete="name"
      />
      <TextField
        label="Contact line"
        value={prefs.contact}
        onChange={(contact) => update({ contact })}
        maxLength={MAX_FIELD}
        placeholder="Website, email or handle"
      />
      <div class="sh-field">
        <span class="sh-field__label">Logo</span>
        <div class="sh-logo">
          {prefs.logo ? <img class="sh-logo__img" src={prefs.logo} alt="Your logo" /> : null}
          <input
            ref={input}
            class="sh-file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label="Choose a logo image"
            onChange={(e) => void onFile(e)}
          />
          {prefs.logo ? (
            <button type="button" class="btn btn-sm" onClick={() => update({ logo: '' })}>
              Remove logo
            </button>
          ) : null}
        </div>
        <span class="sh-hint" role={error ? 'alert' : undefined}>
          {error || 'Resized to 256 px or less and kept on this device only.'}
        </span>
      </div>
      <Toggle
        label='Show "Made with Gatecast"'
        checked={prefs.showWatermark}
        onChange={(showWatermark) => update({ showWatermark })}
      />
    </Group>
  );
}
