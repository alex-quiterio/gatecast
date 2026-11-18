import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CENTER_NAMES, type CenterName } from '@/types';
import { Detail } from '@ui/components/detail';
import { Icon } from '@ui/components/icons';
import { Tabs } from '@ui/components/tabs';
import { useApp } from '@ui/context';
import { useMediaQuery } from '@ui/hooks';
import { TAB_LABELS, entriesFor, filterEntries } from '@ui/library-logic';
import { LIBRARY_TABS, buildHash, type LibraryTab } from '@ui/router';
import { centerLabel } from './common';

/** The library: a searchable reference with deep links (`#/library/gate/20`). */
export function LibraryView({
  tab: initialTab,
  id: initialId,
}: {
  tab: LibraryTab;
  id: string | undefined;
}) {
  const { replaceHash } = useApp();
  const [tab, setTab] = useState(initialTab);
  const [openId, setOpenId] = useState(initialId);
  const [query, setQuery] = useState('');
  const [center, setCenter] = useState<CenterName | ''>('');
  const split = useMediaQuery('(min-width: 1024px)');
  const listRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => entriesFor(tab), [tab]);
  const shown = useMemo(
    () => filterEntries(entries, tab, query, center),
    [entries, tab, query, center],
  );
  const selected = entries.find((e) => e.id === openId);

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
    replaceHash(buildHash(id ? { name: 'library', tab, id } : { name: 'library', tab }));
  };
  const changeTab = (next: string): void => {
    const t = LIBRARY_TABS.find((x) => x === next);
    if (!t || t === tab) return;
    setTab(t);
    setOpenId(undefined);
    setCenter('');
    replaceHash(buildHash({ name: 'library', tab: t }));
  };

  return (
    <div class="view library">
      <header class="page-head">
        <p class="micro">Reference</p>
        <h1>Library</h1>
        <p class="lead">
          Every gate, channel, center, type and term in one place. Open an item for the full
          explanation; each has its own link you can share.
        </p>
      </header>
      <div class="lib-layout">
        <section class="lib-main" aria-label="Library list">
          <Tabs
            prefix="lib"
            label="Library sections"
            items={LIBRARY_TABS.map((id) => ({ id, label: TAB_LABELS[id] }))}
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
              <p class="empty-hint">Nothing matches that search. Try a gate number or a keyword.</p>
            ) : null}
            {shown.map((entry) => {
              const isOpen = openId === entry.id;
              return (
                <div
                  key={entry.id}
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
                    {entry.subtitle ? <span class="lib-sub">{entry.subtitle}</span> : null}
                    {split ? null : <Icon name="chevron" size={14} class="icon chev" />}
                  </button>
                  {!split && isOpen ? (
                    <div class="lib-inline">
                      <Detail tipKey={entry.tip} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
        {split ? (
          <aside class="lib-detail inspector" aria-label="Explanation" aria-live="polite">
            {selected ? (
              <div class="pane-body">
                <Detail tipKey={selected.tip} />
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
