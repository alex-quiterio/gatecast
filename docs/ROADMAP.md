# Ideas for improving Gatecast

A working list, limited to **content** (what the app says and how much of Human Design it covers) and
**usability** (how it feels to use). Effort is a rough guess: **S** is a day or less, **M** a few days,
**L** a week or more.

## Start here: the highest-value picks

| #   | Idea                                                          | Area      | Effort |
| --- | ------------------------------------------------------------- | --------- | ------ |
| 1   | "Try an example" chart and a five-step reading guide          | Usability | S      |
| 2   | Birth-time sensitivity: show which results are fragile        | Both      | M      |
| 3   | "I don't know my birth time" mode                             | Both      | M      |
| 4   | Line-level meanings (gate.line), not just gates               | Content   | L      |
| 5   | Incarnation Cross names and descriptions                      | Content   | M      |
| 4   | Saved charts: rename, notes, groups, backup and restore       | Usability | M      |
| 5   | Plain-language mode, and clear "what to try" experiments      | Content   | M      |
| 6   | Link everything: library entries mark what is in _your_ chart | Usability | M      |

Why these: 1 and 4 remove the friction a new person hits in the first five minutes. 2 and 3 are about
honesty, since birth time is the biggest source of "my chart looks different in another tool". 5 is the gap
between a chart and a reading that actually helps someone.

_Done since this list was first written: line-level meanings for all 64 gates (with what each looks like when it
flows and under pressure), all 192 Incarnation Cross names with a description of each, the Circuits view with
deeper copy and a comparison text for two leading circuits, the Library marking everything in "my chart" with
related links, and a professional print report and share card._

## Content

### What is missing from a full reading

- **Variables.** Determination, Environment, Perspective and Motivation come from the colour, tone and
  base of the Sun and Node activations. The engine computes colour and tone but not **base**; adding it is
  small, and the interpretations are the real work. _M_
- **Reflectors.** The lunar cycle matters more than anything else for them. A short guide, and a view of
  the Moon's gate through the cycle, would make the Reflector reading much less thin. _M_
- **Channel and gate depth.** Many blurbs are one or two sentences. Add: a "healthy expression", an "under
  pressure" note, and one sentence on how the gate feels when it is _undefined_ in the other person. _M_

### Making it useful, not just correct

- **Plain-language mode.** A toggle that rewrites the key texts without jargon ("how you make decisions"
  instead of "Authority"). The same chart, two reading levels. _M_
- **"What to try" experiments.** For each Type and Authority, three small things to notice over a week,
  framed as experiments rather than rules. Fits the honesty of the disclaimer. _M_
- **Relationship content.** Compare shows the dynamics and a one-line explanation per dynamic. Add: a
  per-channel note for electromagnetic and dominance pairs, who _bridges_ a split definition, and which
  centers each person leaves open for the other. _L_
- **More glossary, and auto-linked terms.** Terms in the body copy should link to their definition. _S_
- **Translations.** Start with Portuguese, Italian and Dutch (the cities people search for suggest where
  readers are). Content is already separated from the UI, so this is a copy project. _L_

### Trust in the copy

- **Proofread the roughly 100 gate and channel blurbs.** They are original wording and have not had a
  human read. _S_
- **Verify the Collective circuit's Logic/Abstract split** for channels 5-15, 18-58 and 29-46, the least
  certain facts in the content. _S_
- **Add "sources and further reading"** to About: where the system comes from, and honest notes on where
  traditions differ. _S_
- **A "Why does my chart differ from another tool?" page.** Gate and line boundaries, birth time, time
  zones, node conventions. It is the single most common question. _S_

## Usability

### First minutes

- **"Try an example".** A button on the empty chart page that loads an invented person, so someone can see
  a finished chart before typing their birth data. _S_
- **A guided tour.** "Read your chart in five steps": Type, Strategy, Authority, Profile, then centers, with
  each step highlighting the relevant part of the drawing. Skippable, and reachable later from the help menu. _M_
- **Forgiving inputs.** Accept typed dates like `14/3/1990`, show the format the user's locale expects, and
  never reset the form after an error. _S_
- **Birth place.** Pressing Enter should pick the first result; leaving the box with text typed but nothing
  chosen should resolve a single clear match or explain what to do. Offer "recent places". Towns under
  15,000 people are not in the data: add a way to enter coordinates, or fall back to the nearest larger
  place with a clear note. _M_

### Accuracy, made visible

- **Birth-time sensitivity.** Next to each planet, show how many minutes until it changes line or gate.
  Summarise as "3 results depend on your birth time being right to within 10 minutes". The Moon makes this
  matter most. _M_
- **Unknown birth time.** Offer a noon chart that marks what is stable all day (most planets) and what is
  not (Moon, and sometimes the Design Moon), instead of silently guessing. _M_
- **Explain the time zone.** Show how the offset was derived ("Portugal was on UTC+0 in March 1990,
  daylight saving began on 25 March") so people can spot a wrong zone for old dates. _S_

### Working with several charts

- **Saved charts.** Rename, edit, duplicate, add a note and a group ("Family", "Friends"); search and sort;
  undo after delete; export and import everything as one file for backup and for moving devices. _M_
- **Compare.** Add a Swap A/B button, a one-paragraph plain-language summary above the diagram, and "compare
  with a saved chart" shortcuts from the chart page. Later: groups of three to five people. _M_
- **Privacy controls in plain sight.** A "My data" screen: what is stored, a one-click export, a one-click
  delete. Warn before sharing that a link contains the name and birth data, and offer to leave the name out. _S_

### Reading the chart

- **Link tables and drawing both ways.** Hovering a row in the activation table highlights the gate on the
  BodyGraph, and the other way around. _S_
- **Bookmarks.** Let people star gates, channels and library entries and keep them with the chart. _S_

### Accessibility and comfort

- **A text version of the chart.** The drawing is SVG; add a structured, screen-reader-friendly summary
  (defined and open centers, channels, gates) that is always one keypress away. _S_
- **Keyboard on the drawing.** Arrow keys to move between gates and centers on the BodyGraph and the
  wheel, with the same details as hover. _M_
- **Colour-blind safe colouring.** Personality and Design differ only by colour in the drawing today; add
  a pattern or shape option. _S_
- **Text size control and a high-contrast theme.** _S_
- **Touch.** Check the drag handle, pinch zoom and bottom sheets on real phones, and the iOS install and
  status-bar appearance. Add swipe between the Overview, Activations, Channels and Centers tabs. _M_

### Small polish

- The "Install" button in the app bar and the install toast can show at the same time: show one.
- On a narrow desktop window the Birth data panel overlays the chart; remember whether the user prefers it
  open or closed.
- Review every empty, error and offline message for tone and for a clear next step.
- A short changelog ("What is new") shown once after an update.

## Known gaps today

Worth saying out loud so nobody trusts what has not been checked:

- The copy has not had a human proofread, and a few circuit facts are unverified (see above).
- Reflector and "Mental" Authority cases are covered only by hand-built tests, not by Swiss Ephemeris
  reference data.
- The light theme has been looked at on one screen only; touch interaction and iOS were checked with
  emulation, not on devices.
- Towns under 15,000 people cannot be found by name.
- There is no unknown-birth-time mode and no Variables yet, so the app is a solid reading but not a complete one.
- The circuit streams follow one widely used division. Teachers draw the lines between Knowing, Centering and
  Integration a little differently (Gatecast uses four Integration channels), and the in-app copy says so.
- The 384 line meanings, 192 cross descriptions and the circuit copy are original wording written for this
  project; they have not had a human proofread. Descriptive text about gates, lines and crosses is neutral
  third person, while older guidance copy (types, centers, circuits) addresses "you": worth unifying.
- The Incarnation Cross names come from one complete published table, cross-checked against a second, partial
  one. In the standard tables a Juxtaposition cross and a Left Angle cross of the same Sun gate share their
  four gates, so those descriptions differ by angle, not by gates.
- The app bundle has grown to about 640 KB (minified) with all the new copy and the QR library. Loading the
  lines, crosses and share tools on demand would cut the first load.
