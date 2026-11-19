import type { VNode } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { buildCardSvg } from '@ui/share/card-svg';
import { cardFacts, cardFileName } from '@ui/share/card-facts';
import { FORMATS, formatOf } from '@ui/share/formats';
import { cardPrivacy } from '@ui/share/privacy';
import { PRESETS } from '@ui/share/prefs';
import {
  canCopyImage,
  copyImage,
  copyTextSafe,
  saveBlob,
  shareImage,
  svgDataUrl,
  svgToPng,
  textBlob,
} from '@ui/share/raster';
import type { ActionResult } from '@ui/share/raster';
import { ACCENTS, ACCENT_IDS, THEME_IDS, resolveTheme } from '@ui/share/themes';
import type { CardThemeId, FormatId, HeroKind, SharePrefs, ShareSubject } from '@ui/share/types';
import { Icon } from '@ui/components/icons';
import { BrandingFields } from './branding-fields';
import { Group, Segmented, Toggle, useDebounced } from './controls';

/** Props of {@link CardPanel}. */
export interface CardPanelProps {
  subject: ShareSubject;
  prefs: SharePrefs;
  update: (patch: Partial<SharePrefs>) => void;
  /** Replace the preferences wholesale (presets). */
  replace: (prefs: SharePrefs) => void;
  /** Announce the outcome of an action. */
  notify: (result: ActionResult) => void;
}

/** The card editor: live preview, options and output actions. */
export function CardPanel({ subject, prefs, update, replace, notify }: CardPanelProps): VNode {
  const settled = useDebounced(prefs);
  const card = useMemo(() => buildCardSvg(subject, settled), [subject, settled]);
  const [busy, setBusy] = useState(false);
  const format = formatOf(prefs.format);
  const isCompare = subject.kind === 'compare';
  const privacy = cardPrivacy(prefs);
  const facts = cardFacts(subject, prefs);
  const fileBase = cardFileName(facts, prefs.format, prefs.showName);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const withPng = async (run: (png: Blob) => Promise<ActionResult>): Promise<void> => {
    setBusy(true);
    try {
      const fresh = buildCardSvg(subject, prefs);
      const png = await svgToPng(fresh.svg, fresh.width, fresh.height, 2);
      notify(
        png ? await run(png) : { ok: false, message: 'This browser could not draw the image.' },
      );
    } finally {
      setBusy(false);
    }
  };
  const downloadPng = (): Promise<void> =>
    withPng((png) => {
      saveBlob(`${fileBase}.png`, png);
      return Promise.resolve({
        ok: true,
        message: `PNG saved (${format.width * 2} x ${format.height * 2})`,
      });
    });
  const downloadSvg = (): void => {
    saveBlob(`${fileBase}.svg`, textBlob(buildCardSvg(subject, prefs).svg, 'image/svg+xml'));
    notify({ ok: true, message: 'SVG saved' });
  };
  const copy = (): Promise<void> => withPng((png) => copyImage(png));
  const share = (): Promise<void> =>
    withPng((png) => shareImage(png, `${fileBase}.png`, facts.title));
  const copyLink = async (): Promise<void> => {
    const ok = await copyTextSafe(subject.link);
    notify({ ok, message: ok ? 'Link copied' : 'Could not copy the link' });
  };
  const hero = card.dropped.length
    ? `Left out to fit this format: ${card.dropped
        .map((d) => (d === 'qr' ? 'QR code' : d === 'cross' ? 'Incarnation Cross' : d))
        .join(', ')}.`
    : '';

  return (
    <div class="sh-layout">
      <div class="sh-stage" data-format={prefs.format}>
        <img
          class="sh-card-img"
          src={svgDataUrl(card.svg)}
          width={format.width}
          height={format.height}
          alt={`Preview of the ${format.label.toLowerCase()} card, ${format.width} by ${format.height} pixels`}
        />
        <p class="sh-stage__meta">
          {format.label} · {format.width} x {format.height} px · PNG at 2x
        </p>
        {hero ? <p class="sh-hint sh-stage__note">{hero}</p> : null}
      </div>
      <div class="sh-controls">
        <div class="sh-presets" role="group" aria-label="Presets">
          {PRESETS.filter((p) => p.mode === 'card').map((p) => (
            <button
              key={p.id}
              type="button"
              class="chip"
              title={p.hint}
              onClick={() => replace(p.apply(prefs))}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Group title="Look">
          <Segmented<FormatId>
            label="Format"
            value={prefs.format}
            options={FORMATS.map((f) => ({
              value: f.id,
              label: f.label,
              hint: `${f.width} x ${f.height}, ${f.hint}`,
            }))}
            onChange={(v) => update({ format: v })}
          />
          <Segmented<CardThemeId>
            label="Theme"
            value={prefs.theme}
            options={THEME_IDS.map((id) => ({
              value: id,
              label: resolveTheme(id, prefs.accent).label,
            }))}
            onChange={(v) => update({ theme: v })}
          />
          <div class="sh-field">
            <span class="sh-field__label" id="sh-accent-label">
              Accent
            </span>
            <div class="sh-swatches" role="radiogroup" aria-labelledby="sh-accent-label">
              {ACCENT_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={prefs.accent === id}
                  aria-label={ACCENTS[id].label}
                  title={ACCENTS[id].label}
                  class="sh-swatch"
                  style={`--sw:${ACCENTS[id].swatch}`}
                  disabled={prefs.theme === 'ink'}
                  onClick={() => update({ accent: id })}
                />
              ))}
            </div>
            {prefs.theme === 'ink' ? <span class="sh-hint">Ink is black and white.</span> : null}
          </div>
          {isCompare ? null : (
            <Segmented<HeroKind>
              label="Graphic"
              value={prefs.hero}
              options={[
                { value: 'bodygraph', label: 'BodyGraph' },
                { value: 'wheel', label: 'Gate wheel' },
              ]}
              onChange={(v) => update({ hero: v })}
            />
          )}
        </Group>
        <Group title="What to show">
          <Toggle
            label="Name"
            checked={prefs.showName}
            onChange={(showName) => update({ showName })}
          />
          <Toggle
            label="Birth details (date, time, place)"
            checked={prefs.showBirth}
            onChange={(showBirth) => update({ showBirth })}
          />
          {isCompare ? null : (
            <Toggle
              label="Circuit bars"
              checked={prefs.showCircuits}
              onChange={(showCircuits) => update({ showCircuits })}
            />
          )}
          <Toggle
            label="QR code to this chart"
            checked={prefs.showQr}
            onChange={(showQr) => update({ showQr })}
          />
          <div class={`sh-privacy sh-privacy--${privacy.level}`} role="note">
            <Icon name="info" size={16} />
            <div>
              <p>{privacy.message}</p>
              {prefs.showQr && prefs.showBirth ? (
                <button
                  type="button"
                  class="btn btn-sm"
                  onClick={() => update({ showBirth: false })}
                >
                  Hide birth details in the image
                </button>
              ) : null}
            </div>
          </div>
        </Group>
        <BrandingFields
          prefs={prefs}
          update={update}
          nameLabel="Name on the card"
          hideName={isCompare}
        />
        <div class="sh-actions">
          <button
            type="button"
            class="btn btn-primary"
            disabled={busy}
            onClick={() => void downloadPng()}
          >
            <Icon name="download" size={16} /> Download PNG
          </button>
          <button type="button" class="btn" onClick={downloadSvg}>
            <Icon name="download" size={16} /> Download SVG
          </button>
          <button
            type="button"
            class="btn"
            disabled={busy}
            title={canCopyImage() ? undefined : 'This browser cannot copy images'}
            onClick={() => void copy()}
          >
            <Icon name="copy" size={16} /> Copy image
          </button>
          {canShare ? (
            <button type="button" class="btn" disabled={busy} onClick={() => void share()}>
              <Icon name="share" size={16} /> Share
            </button>
          ) : null}
          <button type="button" class="btn" onClick={() => void copyLink()}>
            <Icon name="copy" size={16} /> Copy link
          </button>
        </div>
      </div>
    </div>
  );
}
