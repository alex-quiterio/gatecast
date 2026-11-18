import { Dialog } from './dialog';
import { Icon } from './icons';

const GROUPS: { title: string; rows: [string, string][] }[] = [
  {
    title: 'Anywhere',
    rows: [
      ['Ctrl/Cmd K or /', 'Quick find'],
      ['?', 'Show this help'],
      ['g then c, m, l, a', 'Go to Chart, Compare, Library, About'],
      ['t', 'Toggle dark and light theme'],
      ['Esc', 'Close a dialog, menu or tooltip'],
    ],
  },
  {
    title: 'On a chart',
    rows: [
      ['s', 'Save the chart on this device'],
      ['u', 'Copy the share link'],
      ['v', 'Switch BodyGraph and gate wheel'],
      ['n', 'Show or hide gate numbers'],
      ['+  -  0', 'Zoom in, zoom out, fit to view'],
      ['p', 'Print'],
    ],
  },
];

/** The keyboard shortcut help dialog (focus-trapped, Escape closes). */
export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Keyboard shortcuts" onClose={onClose}>
      <header class="dialog-head">
        <h2>Keyboard shortcuts</h2>
        <button type="button" class="btn btn-icon btn-ghost" aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h3 class="micro">{g.title}</h3>
          <dl class="shortcuts">
            {g.rows.map(([keys, what]) => (
              <div key={keys}>
                <dt>
                  <kbd>{keys}</kbd>
                </dt>
                <dd>{what}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </Dialog>
  );
}
