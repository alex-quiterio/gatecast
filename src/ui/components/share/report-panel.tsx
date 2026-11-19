import type { VNode } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { PAPERS, PX_PER_MM } from '@ui/share/paper';
import { PRESETS } from '@ui/share/prefs';
import { reportPrivacy } from '@ui/share/privacy';
import { copyTextSafe, saveBlob, textBlob } from '@ui/share/raster';
import type { ActionResult } from '@ui/share/raster';
import { buildReportModel } from '@ui/share/report-model';
import type { PaperId, ReportThemeId, SectionId, SharePrefs, ShareSubject } from '@ui/share/types';
import { SECTION_IDS } from '@ui/share/types';
import { reportCss } from '@ui/share/report-css';
import { Icon } from '@ui/components/icons';
import { BrandingFields } from './branding-fields';
import { Group, Segmented, TextField, Toggle, useDebounced } from './controls';
import { buildReportHtml, printReport, reportFileName } from './report-output';
import { ReportPages } from './report-pages';

const SECTION_LABELS: Record<SectionId, string> = {
  summary: 'Cover and summary',
  activations: 'Activations',
  centers: 'Centers and channels',
  circuits: 'Circuits',
  lines: 'Your lines (long)',
  wheel: 'Gate wheel',
  glossary: 'Glossary of terms',
};

/** Props of {@link ReportPanel}. */
export interface ReportPanelProps {
  subject: ShareSubject;
  prefs: SharePrefs;
  update: (patch: Partial<SharePrefs>) => void;
  replace: (prefs: SharePrefs) => void;
  notify: (result: ActionResult) => void;
}

/** Width of the preview area, tracked with a ResizeObserver when there is one. */
function useWidth(ref: { current: HTMLElement | null }): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = (): void => setWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/** The report editor: scaled page preview, options and output actions. */
export function ReportPanel({ subject, prefs, update, replace, notify }: ReportPanelProps): VNode {
  const settled = useDebounced(prefs, 220);
  const generated = useRef(new Date());
  const model = useMemo(
    () => buildReportModel(subject, settled, generated.current),
    [subject, settled],
  );
  const live = useMemo(() => buildReportModel(subject, prefs, generated.current), [subject, prefs]);
  const paper = PAPERS[prefs.paper];
  const stage = useRef<HTMLDivElement>(null);
  const width = useWidth(stage);
  const natural = paper.widthMm * PX_PER_MM;
  const scale = width > 0 ? Math.min(1, Math.max(0.2, (width - 24) / natural)) : 0.6;
  const [pages, setPages] = useState(0);
  const [busy, setBusy] = useState(false);
  const privacy = reportPrivacy(prefs);

  const print = async (): Promise<void> => {
    setBusy(true);
    try {
      const count = await printReport(live, subject);
      notify(
        count > 0
          ? { ok: true, message: 'Choose "Save as PDF" in the print dialog to keep a file' }
          : { ok: false, message: 'Printing is not available in this browser' },
      );
    } finally {
      setBusy(false);
    }
  };
  const download = async (): Promise<void> => {
    setBusy(true);
    try {
      const html = await buildReportHtml(live, subject);
      saveBlob(reportFileName(live, 'html'), textBlob(html, 'text/html'));
      notify({ ok: true, message: 'HTML report saved. It works offline and prints the same.' });
    } finally {
      setBusy(false);
    }
  };
  const copyLink = async (): Promise<void> => {
    const ok = await copyTextSafe(subject.link);
    notify({ ok, message: ok ? 'Link copied' : 'Could not copy the link' });
  };
  const setSection = (id: SectionId, on: boolean): void =>
    update({ sections: { ...prefs.sections, [id]: on } });

  return (
    <div class="sh-layout">
      <div class="sh-stage sh-stage--pages">
        <style>{reportCss()}</style>
        <div
          class="sh-pages"
          ref={stage}
          tabIndex={0}
          role="region"
          aria-label="Report preview, scrollable"
        >
          <ReportPages model={model} subject={subject} scale={scale} onPaginated={setPages} />
        </div>
        <p class="sh-stage__meta">
          {pages} {pages === 1 ? 'page' : 'pages'} · {paper.label}
        </p>
      </div>
      <div class="sh-controls">
        <div class="sh-presets" role="group" aria-label="Presets">
          {PRESETS.filter((p) => p.mode === 'report').map((p) => (
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
        <Group title="Document">
          <Segmented<PaperId>
            label="Paper size"
            value={prefs.paper}
            options={[
              { value: 'a4', label: 'A4' },
              { value: 'letter', label: 'US Letter' },
            ]}
            onChange={(v) => update({ paper: v })}
          />
          <Segmented<ReportThemeId>
            label="Theme"
            value={prefs.reportTheme}
            options={[
              { value: 'paper', label: 'Paper (colour)' },
              { value: 'ink', label: 'Ink (black and white)' },
            ]}
            onChange={(v) => update({ reportTheme: v })}
          />
        </Group>
        <Group title="Sections">
          {SECTION_IDS.map((id) => (
            <Toggle
              key={id}
              label={SECTION_LABELS[id]}
              checked={prefs.sections[id]}
              onChange={(on) => setSection(id, on)}
            />
          ))}
        </Group>
        <Group title="Privacy">
          <Toggle
            label="Include birth details"
            checked={prefs.showBirth}
            onChange={(showBirth) => update({ showBirth })}
          />
          <Toggle
            label="QR code to this chart (last page)"
            checked={prefs.showQr}
            onChange={(showQr) => update({ showQr })}
          />
          <div class={`sh-privacy sh-privacy--${privacy.level}`} role="note">
            <Icon name="info" size={16} />
            <p>{privacy.message}</p>
          </div>
        </Group>
        <BrandingFields prefs={prefs} update={update} nameLabel="Prepared for (name override)" />
        <Group title="Notes">
          <TextField
            label="Printed on the last page"
            value={prefs.notes}
            onChange={(notes) => update({ notes: notes.slice(0, 2000) })}
            multiline
            maxLength={2000}
            placeholder="Session notes, next steps, anything for the client"
          />
          <Toggle
            label="Remember these notes on this device"
            checked={prefs.rememberNotes}
            onChange={(rememberNotes) => update({ rememberNotes })}
            hint="Off by default: notes are not saved and vanish when you close this window. Turning it on stores them in this browser only."
          />
        </Group>
        <div class="sh-actions">
          <button
            type="button"
            class="btn btn-primary"
            disabled={busy}
            onClick={() => void print()}
          >
            <Icon name="print" size={16} /> Print / Save as PDF
          </button>
          <button type="button" class="btn" disabled={busy} onClick={() => void download()}>
            <Icon name="download" size={16} /> Download as HTML
          </button>
          <button type="button" class="btn" onClick={() => void copyLink()}>
            <Icon name="copy" size={16} /> Copy link
          </button>
        </div>
      </div>
    </div>
  );
}
