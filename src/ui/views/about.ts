import { DISCLAIMER } from '@content';
import { h } from '@ui/dom';

/** Repository link shown on the About page and in the footer. */
export const REPO_URL = 'https://github.com/alex-quiterio/gatecast';

function ext(href: string, text: string): HTMLAnchorElement {
  return h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, text);
}

/** The About page: what, how, privacy, credits. */
export function aboutView(): HTMLElement {
  return h(
    'div',
    { class: 'view view-about prose' },
    h(
      'header',
      { class: 'page-head' },
      h('p', { class: 'eyebrow' }, 'About'),
      h('h1', null, 'About Gatecast'),
    ),
    h(
      'section',
      { class: 'card' },
      h('h2', null, 'What is Human Design?'),
      h(
        'p',
        null,
        'Human Design is a contemporary system, introduced in 1987, that blends ideas from astrology, the I Ching, the Kabbalah tree of life and the chakra system. It maps the sky at your birth, and again at a moment about 88 degrees of solar arc earlier, onto a diagram called the BodyGraph.',
      ),
      h(
        'p',
        null,
        'It is a framework for self-reflection and storytelling, not a science. Nothing here has been shown to predict health, fate or behaviour. Use it the way you would use a journal prompt: keep what helps, leave the rest.',
      ),
    ),
    h(
      'section',
      { class: 'card notice', role: 'note' },
      h('h2', null, 'Disclaimer'),
      h('p', null, DISCLAIMER),
    ),
    h(
      'section',
      { class: 'card' },
      h('h2', null, 'How the chart is computed'),
      h(
        'ul',
        null,
        h(
          'li',
          null,
          'Planet positions come from astronomy-engine, a pure TypeScript implementation of high-precision ephemerides (comparable to the Swiss Ephemeris for this purpose: arc-minute accuracy for the Sun and planets, and good accuracy for the Moon and nodes).',
        ),
        h(
          'li',
          null,
          'Your local birth time is converted to UTC with the offset you give (or the time zone rules of your browser for that date).',
        ),
        h(
          'li',
          null,
          'The Design moment is when the Sun stood exactly 88 degrees of ecliptic longitude before its birth position, found numerically.',
        ),
        h(
          'li',
          null,
          'Each longitude maps onto the 64-gate wheel (5.625 degrees per gate, then lines, colors, tones and bases by successive sixths).',
        ),
      ),
      h('h3', null, 'Accuracy caveats'),
      h(
        'ul',
        null,
        h(
          'li',
          null,
          'A planet close to a gate or line boundary can fall on either side if your birth time is off by minutes. The Moon crosses a line roughly every 2 hours, and a gate roughly every 10 hours.',
        ),
        h(
          'li',
          null,
          'Historical time zones and daylight saving rules are taken from your browser; very old or unusual dates may need a manual UTC offset.',
        ),
        h(
          'li',
          null,
          'Different programs sometimes use slightly different conventions at boundaries. Cross-check important charts with another tool.',
        ),
      ),
      h(
        'p',
        null,
        'Cross-check with ',
        ext('https://www.mybodygraph.com', 'MyBodyGraph'),
        ' or ',
        ext('https://www.geneticmatrix.com', 'Genetic Matrix'),
        '.',
      ),
    ),
    h(
      'section',
      { class: 'card' },
      h('h2', null, 'Privacy'),
      h(
        'ul',
        null,
        h(
          'li',
          null,
          'Everything runs in your browser. No network requests are made after the page loads: no analytics, no trackers, no external fonts or scripts.',
        ),
        h(
          'li',
          null,
          "People you choose to save are kept only in this browser's localStorage, as birth details. Delete them any time from the Chart page.",
        ),
        h(
          'li',
          null,
          'A share link contains the birth details in its address (after the #). That part is never sent to a server by your browser, but anyone you give the link to can read it.',
        ),
      ),
    ),
    h(
      'section',
      { class: 'card' },
      h('h2', null, 'Credits and licenses'),
      h(
        'ul',
        null,
        h(
          'li',
          null,
          'Astronomical calculations: ',
          ext('https://github.com/cosinekitty/astronomy', 'astronomy-engine'),
          ' by Don Cross, MIT license.',
        ),
        h('li', null, 'Gatecast itself is open source: ', ext(REPO_URL, REPO_URL), '.'),
      ),
    ),
  );
}

/** Friendly 404 shown inside the shell. */
export function notFoundView(path: string): HTMLElement {
  return h(
    'div',
    { class: 'view prose' },
    h(
      'header',
      { class: 'page-head' },
      h('p', { class: 'eyebrow' }, 'Lost in the stars'),
      h('h1', null, 'Page not found'),
    ),
    h('p', null, path ? `There is nothing at ${path}.` : 'There is nothing here.'),
    h('p', null, h('a', { class: 'btn btn-primary', href: '#/' }, 'Back to the chart')),
  );
}
