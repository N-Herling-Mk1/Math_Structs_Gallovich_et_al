# Introduction to Mathematical Structures — study repo

A living companion to Steven Galovich, *Introduction to Mathematical Structures*.
Proofs, tables, and interactive graphs, organized by the book's seven chapters and
driven entirely by a single editable `content.json`. Adding material is a data edit —
no code changes required.

```
galovich-structures/          ← keep all files in ONE folder (no subfolders)
├── index.html          # shell: loads fonts, KaTeX, Chart.js
├── content.json        # ← the whole book skeleton + entries live here
├── styles.css          # theme (cyan/amber on near-black)
├── app.js              # loader, nav, block renderer, graph widgets
└── README.md
```

## Run it

`fetch()` is blocked on `file://`, so serve over HTTP:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

On **GitHub Pages** it works with zero setup — push the folder and enable Pages on the branch.

## Chapters

The seven chapters are already scaffolded in `content.json`:

1. Tools — *(populated: §1.3, Theorem 1.3.6 The Division Algorithm, p.55)*
2. Set Theory
3. Relations and Functions
4. Cardinality
5. Discrete Structures
6. Algebraic Structures
7. The Real Number System

Empty chapters/sections render as "No entries yet" in the sidebar — fill them in as you go.

## Content schema

`content.json` is `book` + a `chapters` array. Each chapter has `sections`; each section has `entries`; each entry is an ordered list of **blocks**.

```jsonc
{
  "id": "ch3",
  "number": 3,
  "title": "Relations and Functions",
  "sections": [
    {
      "id": "3.2",
      "number": "3.2",
      "title": "Equivalence Relations",
      "entries": [
        {
          "id": "thm-3.2.x-some-result",   // must be unique; becomes the URL hash
          "label": "Theorem 3.2.x",
          "title": "Some Result",
          "page": 120,
          "tags": ["relations", "partitions"],
          "blocks": [ /* ordered blocks, see below */ ]
        }
      ]
    }
  ]
}
```

### Block types

Blocks render top-to-bottom in the order listed.

| `type` | fields | renders as |
|---|---|---|
| `prose` | `html` | body text. May contain `<h3>` subheadings and `$…$` / `$$…$$` math |
| `theorem` | `html`, `label?`, `page?` | cyan-bordered statement box |
| `proof` | `html` | slate-bordered proof box |
| `note` | `title?`, `html` | quiet callout |
| `insight` | `title?`, `html` | amber callout |
| `limitation` | `title?`, `html` | amber-tinted "what breaks" callout |
| `summary` | `title?`, `html` | framed wrap-up box |
| `table` | `title?`, `columns[]`, `rows[][]` | data table |
| `widget` | `widget`, `params{}`, `caption?` | an interactive graph (see registry) |

Math uses **KaTeX** with `$inline$` and `$$display$$`. In JSON, backslashes double:
`$0 \\le r < b$` and `$$a = bq + r$$`.

### Graph widget registry

Each `widget` block names a renderer in `app.js` and passes `params`. All are reusable — change the numbers and they re-derive everything.

| `widget` | params | shows |
|---|---|---|
| `sawtooth` | `b, aMin, aMax` | fix `b`, walk `a`: remainder sawtooth + quotient staircase |
| `signed` | `b, aMin, aMax, mark` | shared `r`, mirror staircases for `±b`; `mark` flags one `a` |
| `complement` | `b, aMin, aMax, mark` | `bq + r = a`: staircase + gap vs the diagonal |
| `lattice` | `b, qCols, mark` | `a = bq + r` as a `(q, r)` coordinate grid |
| `parallel_q` | `b, qMax, mark` | `a = bq + r` as parallel lines (slope = divisor) |
| `fixedq_slice` | `q, bMax, aMax, bSlice, mark` | swap `b`↔`q`: fixed-`q` lines sliced at one `b` |

Example block:

```json
{ "type": "widget", "widget": "sawtooth",
  "params": { "b": 6, "aMin": 0, "aMax": 18 },
  "caption": "Same machine at $b=6$ — the period is now six." }
```

## How to add things

- **A new entry** — append an entry object to the right section's `entries` array. It appears in the sidebar and at `#<id>` immediately.
- **A new section** — append to a chapter's `sections` array.
- **A new chapter** — append to `chapters` (or just fill in the empty ones).
- **A new graph type** — add a function to the `WIDGETS` object in `app.js` with signature `(host, params)`; build a chart with `canvasIn(host)` + `mkChart(...)`, or set `host.innerHTML` for SVG. Then reference it from a `widget` block. Call `legend(host, items)` for the key.

## Stack

KaTeX (math), Chart.js (line graphs), hand-built SVG (lattice + slice), all from CDN.
Fonts: Orbitron (display), Share Tech Mono (data/labels), Inter (body).
