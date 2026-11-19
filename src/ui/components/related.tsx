import type { Chart } from '@/types';
import { readMoreLinks, relatedFor } from '@ui/related-logic';
import type { LibraryTab } from '@ui/router';
import { Chip } from './info-button';

/**
 * A "Related" block of a library entry: labelled rows of chips that move
 * within the library (a gate's center and channels, a channel's gates and
 * circuit, a center's gates, ...). Renders nothing when there is nothing related.
 */
export function Related({ tab, id }: { tab: LibraryTab; id: string }) {
  const groups = relatedFor(tab, id);
  if (groups.length === 0) return null;
  return (
    <nav class="related" aria-label="Related in the library">
      <h4 class="micro">Related</h4>
      {groups.map((g) => (
        <div class="related-row" key={g.label}>
          <span class="related-label">{g.label}</span>
          <ul class="related-chips">
            {g.links.map((l) => (
              <li key={l.tip}>
                <Chip tip={l.tip}>{l.text}</Chip>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Links from the chart's inspector to the matching library entries. */
export function ReadMore({ selected, chart }: { selected: string | undefined; chart: Chart }) {
  const links = readMoreLinks(selected, chart);
  if (links.length === 0) return null;
  return (
    <nav class="read-more" aria-label="Read more in the Library">
      <h4 class="micro">Read more in the Library</h4>
      <ul class="related-chips">
        {links.map((l) => (
          <li key={l.hash}>
            <a class="chip chip-link" href={l.hash}>
              {l.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
