import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CENTER_NAMES, type CenterName } from '@/types';
import { Detail } from '@ui/components/detail';
import { Icon } from '@ui/components/icons';
import { MyChartChip } from '@ui/components/my-chart-chip';
import { Related } from '@ui/components/related';
import { Tabs } from '@ui/components/tabs';
import { useApp } from '@ui/context';
import { useMediaQuery } from '@ui/hooks';
import type { CrossAngle, Quarter } from '@content/schema';
import { ANGLE_ORDER, QUARTER_ORDER } from '@ui/cross-logic';
import {
  TAB_LABELS,
  entriesFor,
  filterEntries,
  libraryTargetFor,
  yourCrossFirst,
} from '@ui/library-logic';
import {
  mineFilterLabel,
  mineIdSet,
  mineMarks,
  tabCount,
  tabCountLabel,
  type MineMark,
} from '@ui/mine-logic';
import { LIBRARY_TABS, buildHash, type LibraryTab } from '@ui/router';
import { centerLabel } from './common';

/** The text badge of an entry that is (or is not) in my chart; never colour alone. */
function MarkBadge({ mark }: { mark: MineMark | undefined }) {
  if (!mark) return null;
  return (
    <span class={`mine-badge${mark.mine ? '' : ' is-quiet'}`}>
      <span aria-hidden="true">{mark.text}</span>
      <span class="sr-only">{mark.label}</span>
    </span>
  );
}

/** A one-line "in your chart" note above an open entry. */
function MineCallout({ mark }: { mark: MineMark | undefined }) {
  if (!mark) return null;
  return <p class={`mine-callout${mark.mine ? '' : ' is-quiet'}`}>{mark.label}</p>;
}

/** The library: a searchable reference with deep links (`#/library/gate/20`). */
export function LibraryView({
  tab: initialTab,
  id: initialId,
  line: initialLine,
}: {
  tab: LibraryTab;
  id: string | undefined;
  line?: number | undefined;
}) {
  const { replaceHash, myChart } = useApp();
  const [tab, setTab] = useState(initialTab);
  const [openId, setOpenId] = useState(initialId);
  const [query, setQuery] = useState('');
  const [center, setCenter] = useState<CenterName | ''>('');
  const [line, setLine] = useState(initialLine);
  const [angle, setAngle] = useState<CrossAngle | ''>('');
  const [quarter, setQuarter] = useState<Quarter | ''>('');
  const [onlyMine, setOnlyMine] = useState(false);
  const split = useMediaQuery('(min-width: 1024px)');
  const listRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => entriesFor(tab), [tab]);
  const marks = useMemo(() => mineMarks(tab, myChart), [tab, myChart]);
  const mine = useMemo(() => mineIdSet(tab, myChart), [tab, myChart]);
  const shown = useMemo(() => {
    const list = filterEntries(entries, tab, query, {
      center,
      angle,
      quarter,
      only: onlyMine && mine.size > 0 ? mine : undefined,
    });
    return tab === 'cross' && !query.trim() ? yourCrossFirst(list, marks) : list;
  }, [entries, tab, query, center, angle, quarter, onlyMine, mine, marks]);
  const tabItems = LIBRARY_TABS.map((id) => {
    const count = tabCount(id, myChart);
    return {
      id,
      label: TAB_LABELS[id],
      count,
      countLabel: count === undefined ? undefined : tabCountLabel(id, count),
    };
  });
  const selected = entries.find((e) => e.id === openId);
  const openMark = selected ? marks.get(selected.id) : undefined;
  const tipFor = (entry: { tip: string; id: string }): string =>
    tab === 'gate' && line && entry.id === openId ? `gateline:${entry.id}.${line}` : entry.tip;

  useEffect(() => {
    if (initialId) {
      queueMicrotask(() =>
        listRef.current
          ?.querySelector<HTMLElement>('[aria-current="true"],[aria-expanded="true"]')
          ?.scrollIntoView({ block: 'center' }),
      );
    }
  }, [initialId]);

  const open = (id: string | undefined): void => {
    setOpenId(id);
    setLine(undefined);
    replaceHash(buildHash(id ? { name: 'library', tab, id } : { name: 'library', tab }));
  };
  // Links inside an explanation (a gate chip, a channel chip, a circuit chip) move within the library.
  const onDetailClick = (event: MouseEvent): void => {
    const el = event.target instanceof Element ? event.target.closest('[data-tip]') : null;
    const key = el?.getAttribute('data-tip');
    const target = key ? libraryTargetFor(key) : undefined;
    if (!target) return;
    setTab(target.tab);
    setOpenId(target.id);
    setLine(target.line);
    setQuery('');
    setCenter('');
    setAngle('');
    setQuarter('');
    setOnlyMine(false);
    replaceHash(buildHash({ name: 'library', ...target }));
    queueMicrotask(() =>
      listRef.current
        ?.querySelector<HTMLElement>('[aria-current="true"],[aria-expanded="true"]')
        ?.scrollIntoView?.({ block: 'nearest' }),
    );
  };
  const changeTab = (next: string): void => {
    const t = LIBRARY_TABS.find((x) => x === next);
    if (!t || t === tab) return;
    setTab(t);
    setOpenId(undefined);
    setLine(undefined);
    setCenter('');
    setAngle('');
    setQuarter('');
    setOnlyMine(false);
    replaceHash(buildHash({ name: 'library', tab: t }));
  };

  return (
    <div class="view library">
      <header class="page-head">
        <p class="micro">Reference</p>
        <h1>Library</h1>
        <p class="lead">
          Every gate and line, channel, circuit, cross, center, type and term in one place. Open an
          item for the full explanation; each has its own link you can share.
        </p>
      </header>
      <div class="lib-mine-bar">
        <MyChartChip />
        <p class="muted small">
          {myChart
            ? 'Entries in your chart carry a badge. Use the Mine filter to see only those.'
            : 'Pick a chart to mark which gates, channels and more are yours.'}
        </p>
      </div>
      <div class="lib-layout">
        <section class="lib-main" aria-label="Library list">
          <Tabs
            prefix="lib"
            label="Library sections"
            items={tabItems}
            value={tab}
            onChange={changeTab}
            class="tabs-scroll"
          />
          <div class="lib-tools">
            <div class="search-field">
              <Icon name="search" />
              <label class="sr-only" for="lib-search">
                Search
              </label>
              <input
                type="search"
                id="lib-search"
                placeholder="Search by number, name or keyword"
                autocomplete="off"
                enterkeyhint="search"
                value={query}
                onInput={(e) => setQuery(e.currentTarget.value)}
              />
            </div>
            {tab === 'gate' ? (
              <div class="filter-chips" role="group" aria-label="Filter by center">
                <button
                  type="button"
                  class="fchip"
                  aria-pressed={center === ''}
                  onClick={() => setCenter('')}
                >
                  All centers
                </button>
                {CENTER_NAMES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    class="fchip"
                    aria-pressed={center === c}
                    onClick={() => setCenter(center === c ? '' : c)}
                  >
                    {centerLabel(c)}
                  </button>
                ))}
              </div>
            ) : null}
            {tab === 'cross' ? (
              <>
                <div class="filter-chips" role="group" aria-label="Filter by angle">
                  <button
                    type="button"
                    class="fchip"
                    aria-pressed={angle === ''}
                    onClick={() => setAngle('')}
                  >
                    All angles
                  </button>
                  {ANGLE_ORDER.map((a) => (
                    <button
                      key={a}
                      type="button"
                      class="fchip"
                      aria-pressed={angle === a}
                      onClick={() => setAngle(angle === a ? '' : a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <div class="filter-chips" role="group" aria-label="Filter by quarter">
                  <button
                    type="button"
                    class="fchip"
                    aria-pressed={quarter === ''}
                    onClick={() => setQuarter('')}
                  >
                    All quarters
                  </button>
                  {QUARTER_ORDER.map((q) => (
                    <button
                      key={q}
                      type="button"
                      class="fchip"
                      aria-pressed={quarter === q}
                      onClick={() => setQuarter(quarter === q ? '' : q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            {mine.size > 0 && tab !== 'glossary' ? (
              <div class="filter-chips" role="group" aria-label="Your chart">
                <button
                  type="button"
                  class="fchip"
                  aria-pressed={onlyMine}
                  onClick={() => setOnlyMine(!onlyMine)}
                >
                  {mineFilterLabel(tab)}
                  {myChart?.input.name ? ` (${myChart.input.name})` : ''}
                </button>
              </div>
            ) : null}
            <p class="muted small count" aria-live="polite">
              {shown.length} {shown.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <div
            class="lib-list"
            role="tabpanel"
            id={`lib-panel-${tab}`}
            aria-labelledby={`lib-tab-${tab}`}
            ref={listRef}
          >
            {shown.length === 0 ? (
              <p class="empty-hint">
                {tab === 'cross' && entries.every((e) => e.kind !== 'cross')
                  ? 'No traditional cross names are listed yet. The angles and quarters above still apply to every chart.'
                  : onlyMine
                    ? 'Nothing in your chart matches. Turn off the filter to see everything.'
                    : 'Nothing matches that search. Try a gate number or a keyword.'}
              </p>
            ) : null}
            {shown.map((entry, index) => {
              const isOpen = openId === entry.id;
              const heading = entry.group && entry.group !== shown[index - 1]?.group;
              return (
                <div class="lib-block" key={entry.id}>
                  {heading ? <h3 class="lib-group micro">{entry.group}</h3> : null}
                  <div
                    class={`lib-item ${isOpen ? 'is-open' : ''}`.trim()}
                    id={`lib-${tab}-${entry.id.replace(/[^\w-]/g, '_')}`}
                  >
                    <button
                      type="button"
                      class="lib-row"
                      {...(split
                        ? { 'aria-current': isOpen ? 'true' : undefined }
                        : { 'aria-expanded': isOpen })}
                      onClick={() => open(isOpen && !split ? undefined : entry.id)}
                    >
                      <span class="lib-title">{entry.title}</span>
                      <MarkBadge mark={marks.get(entry.id)} />
                      {entry.subtitle ? <span class="lib-sub">{entry.subtitle}</span> : null}
                      {entry.meta ? <span class="lib-meta">{entry.meta}</span> : null}
                      {split ? null : <Icon name="chevron" size={14} class="icon chev" />}
                    </button>
                    {entry.gates ? (
                      <ul class="lib-gates" aria-label="The four gates">
                        {entry.gates.map((g, i) => (
                          <li
                            key={i}
                            class={`chip chip-mono chip-static${g === entry.sunGate && i === 0 ? ' is-sun' : ''}`}
                          >
                            {g}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {!split && isOpen ? (
                      <div class="lib-inline" onClick={onDetailClick}>
                        <MineCallout mark={marks.get(entry.id)} />
                        <Detail tipKey={tipFor(entry)} chart={myChart} />
                        <Related tab={tab} id={entry.id} />
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        {split ? (
          <aside
            class="lib-detail inspector"
            aria-label="Explanation"
            aria-live="polite"
            onClick={onDetailClick}
          >
            {selected ? (
              <div class="pane-body">
                <MineCallout mark={openMark} />
                <Detail tipKey={tipFor(selected)} chart={myChart} />
                <Related tab={tab} id={selected.id} />
              </div>
            ) : (
              <p class="empty-hint">Pick an entry on the left to read its full explanation.</p>
            )}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
