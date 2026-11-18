import type { ComponentChildren } from 'preact';
import { DISCLAIMER } from '@content';

/** Repository link shown on the About page and in the footer. */
export const REPO_URL = 'https://github.com/alex-quiterio/gatecast';

function Ext({ href, children }: { href: string; children: ComponentChildren }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/** The About page: what, how, privacy, credits. */
export function AboutView() {
  return (
    <div class="view about prose">
      <header class="page-head">
        <p class="micro">About</p>
        <h1>About Gatecast</h1>
      </header>
      <section class="panel">
        <h2>What is Human Design?</h2>
        <p>
          Human Design is a contemporary system, introduced in 1987, that blends ideas from
          astrology, the I Ching, the Kabbalah tree of life and the chakra system. It maps the sky
          at your birth, and again at a moment about 88 degrees of solar arc earlier, onto a diagram
          called the BodyGraph.
        </p>
        <p>
          It is a framework for self-reflection and storytelling, not a science. Nothing here has
          been shown to predict health, fate or behaviour. Use it the way you would use a journal
          prompt: keep what helps, leave the rest.
        </p>
      </section>
      <section class="panel notice" role="note">
        <h2>Disclaimer</h2>
        <p>{DISCLAIMER}</p>
      </section>
      <section class="panel">
        <h2>How the chart is computed</h2>
        <ul>
          <li>
            Planet positions come from astronomy-engine, a pure TypeScript implementation of
            high-precision ephemerides (comparable to the Swiss Ephemeris for this purpose:
            arc-minute accuracy for the Sun and planets, and good accuracy for the Moon and nodes).
          </li>
          <li>
            Your local birth time is converted to UTC with the offset you give (or the time zone
            rules of your browser for that date).
          </li>
          <li>
            The Design moment is when the Sun stood exactly 88 degrees of ecliptic longitude before
            its birth position, found numerically.
          </li>
          <li>
            Each longitude maps onto the 64-gate wheel (5.625 degrees per gate, then lines, colors,
            tones and bases by successive sixths).
          </li>
        </ul>
        <h3>Accuracy caveats</h3>
        <ul>
          <li>
            A planet close to a gate or line boundary can fall on either side if your birth time is
            off by minutes. The Moon crosses a line roughly every 2 hours, and a gate roughly every
            10 hours.
          </li>
          <li>
            Historical time zones and daylight saving rules are taken from your browser; very old or
            unusual dates may need a manual UTC offset.
          </li>
          <li>
            Different programs sometimes use slightly different conventions at boundaries.
            Cross-check important charts with another tool.
          </li>
        </ul>
        <p>
          Cross-check with <Ext href="https://www.mybodygraph.com">MyBodyGraph</Ext> or{' '}
          <Ext href="https://www.geneticmatrix.com">Genetic Matrix</Ext>.
        </p>
      </section>
      <section class="panel">
        <h2>Privacy</h2>
        <ul>
          <li>
            Everything runs in your browser. No network requests are made after the page loads: no
            analytics, no trackers, no external fonts or scripts.
          </li>
          <li>
            People you choose to save are kept only in this browser&apos;s localStorage, as birth
            details. Delete them any time from the Saved charts list.
          </li>
          <li>
            A share link contains the birth details in its address (after the #). That part is never
            sent to a server by your browser, but anyone you give the link to can read it.
          </li>
        </ul>
      </section>
      <section class="panel">
        <h2>Credits and licenses</h2>
        <ul>
          <li>
            Astronomical calculations:{' '}
            <Ext href="https://github.com/cosinekitty/astronomy">astronomy-engine</Ext> by Don
            Cross, MIT license.
          </li>
          <li>
            City data: <Ext href="https://www.geonames.org">GeoNames</Ext> (cities of 15,000 people
            or more), licensed{' '}
            <Ext href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</Ext>. Reduced to
            names, countries and time zones.
          </li>
          <li>
            Gatecast itself is open source: <Ext href={REPO_URL}>{REPO_URL}</Ext>.
          </li>
        </ul>
      </section>
    </div>
  );
}

/** Friendly 404 shown inside the shell. */
export function NotFoundView({ path }: { path: string }) {
  return (
    <div class="view prose">
      <header class="page-head">
        <p class="micro">Lost in the stars</p>
        <h1>Page not found</h1>
      </header>
      <p>{path ? `There is nothing at ${path}.` : 'There is nothing here.'}</p>
      <p>
        <a class="btn btn-primary" href="#/">
          Back to the chart
        </a>
      </p>
    </div>
  );
}
