import type { VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { loadPrefs, savePrefs } from '@ui/share/prefs';
import type { ActionResult } from '@ui/share/raster';
import type { SharePrefs, ShareSubject } from '@ui/share/types';
import { Dialog } from '@ui/components/dialog';
import { Icon } from '@ui/components/icons';
import { useToast } from '@ui/components/toast';
import { CardPanel } from './card-panel';
import { Segmented } from './controls';
import { ReportPanel } from './report-panel';

export type { ShareSubject } from '@ui/share/types';

/** Props of {@link ShareDialog}. */
export interface ShareDialogProps {
  /** `card` makes a shareable image, `report` a printable document. */
  mode: 'card' | 'report';
  subject: ShareSubject;
  onClose: () => void;
}

/**
 * The share card and print report dialog. Options (format, theme, your
 * branding, privacy toggles) are remembered in `localStorage` under
 * `hd:v1:share-prefs`; nothing is ever sent over the network.
 */
export function ShareDialog({ mode: initialMode, subject, onClose }: ShareDialogProps): VNode {
  const toast = useToast();
  const [mode, setMode] = useState<'card' | 'report'>(initialMode);
  const [prefs, setPrefs] = useState<SharePrefs>(() => loadPrefs());
  const [status, setStatus] = useState<ActionResult | undefined>();
  const update = useCallback(
    (patch: Partial<SharePrefs>) => setPrefs((p) => ({ ...p, ...patch })),
    [],
  );
  const replace = useCallback((next: SharePrefs) => setPrefs(next), []);
  const notify = useCallback(
    (result: ActionResult) => {
      setStatus(result);
      toast(result.message);
    },
    [toast],
  );
  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);
  useEffect(() => {
    if (!status) return;
    const id = setTimeout(() => setStatus(undefined), 5000);
    return () => clearTimeout(id);
  }, [status]);
  const title = mode === 'card' ? 'Share card' : 'Print report';
  return (
    <Dialog title={title} onClose={onClose} variant="sheet" class="sh-dialog">
      <header class="sh-head">
        <h2>{title}</h2>
        <Segmented<'card' | 'report'>
          label="What to make"
          value={mode}
          options={[
            { value: 'card', label: 'Image card' },
            { value: 'report', label: 'Report' },
          ]}
          onChange={setMode}
          class="sh-mode"
        />
        <button type="button" class="btn btn-icon btn-ghost" aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>
      {mode === 'card' ? (
        <CardPanel
          subject={subject}
          prefs={prefs}
          update={update}
          replace={replace}
          notify={notify}
        />
      ) : (
        <ReportPanel
          subject={subject}
          prefs={prefs}
          update={update}
          replace={replace}
          notify={notify}
        />
      )}
      <p class="sh-status" role="status" data-ok={status ? String(status.ok) : undefined}>
        {status?.message ?? ''}
      </p>
    </Dialog>
  );
}
