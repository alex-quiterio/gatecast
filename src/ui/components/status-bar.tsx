import type { Chart } from '@/types';
import { auditFacts } from '@ui/chart-facts';

/** The audit strip of the chart workspace: where the numbers came from. */
export function StatusBar({ chart }: { chart: Chart }) {
  return (
    <footer class="statusbar" aria-label="Calculation details">
      <span class="status-item status-local">
        <span class="dot" aria-hidden="true" /> Computed locally
      </span>
      {auditFacts(chart).map((f) => (
        <span class="status-item" key={f.label}>
          <span class="micro">{f.label}</span> <span class="mono">{f.value}</span>
        </span>
      ))}
    </footer>
  );
}
