# Taste — an aesthetic-profiling picker for Claude

Swipe through design references two at a time. Taste ranks them, infers your
design taste along orthogonal axes, and exports a **Claude-ready aesthetic
profile**: axis scores, [W3C DTCG](https://tr.designtokens.org/) design tokens,
and a drop-in `SKILL.md` brief.

It exists because the off-the-shelf tools don't do this. UX preference tests
(Lyssna, Maze, Useberry) output *group* preference percentages; conjoint
platforms (Sawtooth, Qualtrics) are built for large-sample market research.
Neither emits a **per-person, generation-ready** profile. Taste does, and runs
entirely in your browser — nothing is uploaded.

```
intro ─▶ judge designs ─▶ flag styles to avoid ─▶ profile + export
```

## Live

- **v6** (current): https://artur-ershov.github.io/taste/v6/
- **v5**: https://artur-ershov.github.io/taste/v5/
- **v4**: https://artur-ershov.github.io/taste/v4/
- **v3**: https://artur-ershov.github.io/taste/v3/
- **v2**: https://artur-ershov.github.io/taste/v2/
- **v1**: https://artur-ershov.github.io/taste/

All are published from this repo by one Actions workflow — v1–v5 from frozen
snapshots in `frozen/`, v6 from the current build.

## What's new in v6 — wider axes, richer stimuli

The set felt thin, so v6 widens what it can measure and how varied the stimuli
look (no real photography yet — still rendered):

- **16 axes** (was 12) — added **Palette** (mono ↔ multicolor), **Fills**
  (flat ↔ gradient), **Type weight** (light ↔ heavy) and **Casing**
  (sentence ↔ uppercase). The generator re-balances and re-decorrelates over all
  16 (max |r| **0.30**, every axis covered — still a tested invariant).
- **Richer rendering** — multi-hue palettes, gradient fills, light/heavy weights,
  uppercase treatments, and **13 web fonts** (Inter, Space Grotesk, Fraunces,
  Playfair, Spectral, JetBrains Mono…) chosen by type voice + weight, so the
  references no longer all look like one font.
- **`accent-2` / `accent-3`** tokens for multicolor profiles.
- Fixed a card-heading misalignment in the component preview.

## What's new in v5 — does it actually work?

Earlier versions assumed the profile was right. v5 makes it falsifiable, and
makes the output tangible:

- **Held-out accuracy** (`lib/validate.ts`) — k-fold cross-validation that holds
  out whole screens, fits on the rest and predicts the unseen choices. ~50% =
  chance (no learnable taste); ~75–85% = it generalizes (cf. CMU's 79.4%).
  `verify` proves the metric separates signal from noise: a decisive simulated
  taste scores ~72%, a random picker ~50%.
- **Blind A/B** — at the end you pick, unlabeled, between your profiled design and
  a foil that breaks your top axes; reliably choosing yours validates the whole
  pipeline (axes → tokens → felt design), the threshold the research flags.
- **Tangible output** — a live component preview (buttons, inputs, cards) with a
  light/dark toggle, plus **Tailwind config** and **shadcn/ui theme** exports
  alongside the brief / tokens / SKILL.md / Claude prompt.

## What's new in v4 — representative stimuli

A taste tool is only as good as its reference set. v1–v3 hand-authored coherent
archetypes, but an audit showed they **bundled correlated traits** and **left some
axes barely varied**, so preferences couldn't be cleanly attributed to a single
axis (and trend/"niceness" could leak in):

- `cornerSoftness ~ geometry` correlated at **r = 0.91**; `density ~ complexity ~
  saturation` at ~0.75 — you couldn't tell which axis a preference came from.
- `typeContrast` had **0** low-contrast examples — that axis was unmeasurable.

v4 regenerates the set deterministically: a few realism anchors + a fill chosen
to **balance every axis** and **decorrelate the axes**:

- max |axis correlation| **0.91 → 0.32**; every axis balanced (low/mid/high).
- `typeContrast` low examples **0 → 15**; 44 references total.
- Execution quality stays controlled by construction (one renderer, one content
  template, contrast-aware colors — audited: worst body text 15:1, button 4.2:1),
  so no reference is preferred just because it's "better made".
- These properties are now a **tested invariant** (`npm run verify` fails if the
  set regresses past the thresholds).

Still open (needs real multi-user data): subtracting a **population baseline** so
universal trends (dark/minimal "feels premium") cancel and only *distinctive*
taste remains. Reported as future work.

## What's new in v3 — fewer shows

The goal of v3 is to reach a confident profile in far fewer screens.

- **Best–worst grids** (best–worst scaling / MaxDiff): each screen shows four
  designs and you pick the one you like *most* and *least*. That yields ~5
  implied pairwise constraints per screen instead of 1 — roughly 5× the signal
  per show — feeding the same Elo/Bradley-Terry/conjoint backend.
- **Adaptive set selection** — each grid is under-sampled + maximally diverse in
  axis space, so every screen is informative.
- **Information-based adaptive stopping** — the conjoint model's weight standard
  errors (from its information matrix, effect-size weighted) drive a live
  confidence meter; the session ends as soon as the part-worths are settled
  (typically ~12–16 screens, ~10× fewer than v2), with min/max bounds.

## What's new in v2

- **Conjoint logit model** (`lib/utility.ts`) — learns true per-axis *part-worths*
  (importance + direction) by fitting a discrete-choice model to the pairwise
  outcomes, disentangling axes that co-occur in the stimulus set. This is the
  roadmap's #1 "break the confounding" item.
- **Information-gain pairing** — once the model is trained, the next pair is the
  one it's most *uncertain* about, not just the nearest in Elo.
- **Realistic stimuli** — each reference now renders as a full landing-page
  screenshot in a browser window (nav, hero + product image, logo cloud,
  feature cards, footer) instead of abstract shapes.
- **Undo + autosave/resume** — sessions survive a refresh; step back with `z`.
- **Importance radar + "what drives your taste"** and a **pick-consistency** score.
- **Two new exports** — a paste-ready **Claude prompt** and **CSS `:root` variables**.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static SPA into dist/
npm run verify     # headless end-to-end check of the scoring + profile pipeline
```

It's a static site (Vite + React + TS, no backend) — deploy `dist/` anywhere.

## How it works

**1. Stimuli — the "hard 20%".** The genuinely hard part of this idea isn't the
math, it's the reference set: organic screenshots vary on many axes at once, so
you can't cleanly attribute a preference to a single axis (the *confounding
problem*). Taste sidesteps it: every reference is a small landing-page mockup
**rendered from its own axis vector** (`src/lib/render.ts`). The tags are ground
truth — what you judge is exactly what's measured — and there are no external
images to host or break. References live in `src/data/references.ts` as coherent
style archetypes plus controlled single-axis variants.

**2. Scoring.** Elo updates live after every pick for the progress UI
(`src/lib/elo.ts`); on completion we re-fit a **Bradley-Terry** model by the MM
algorithm with light smoothing (`src/lib/bradleyTerry.ts`) for a cleaner,
order-independent ranking that recovers strengths even from sparse comparisons.
Pairs are chosen adaptively (`src/lib/pairing.ts`): cover the least-seen
references first, then pit *similar-strength* ones against each other, where the
signal is highest.

**3. Profile.** Axis scores are a **strength-weighted average** of the
references' tags — weighted by a softmax of Bradley-Terry strength, so the
references you preferred dominate smoothly (`src/lib/profile.ts`). Each axis gets
a confidence from how much data you gave and how much your preferred references
*agree* on that axis.

**4. Export — three layers** (`src/lib/tokens.ts`, `src/lib/brief.ts`):

| Layer | What | For |
| --- | --- | --- |
| Axis scores | `{ "density": -27, "saturation": -16, … }` + confidence | inspection / re-use |
| Design tokens | W3C DTCG JSON — OKLCH colors, type, spacing, radius, shadow | a design system |
| Style brief + `SKILL.md` | natural-language feel + emulate/avoid references | **Claude reads this** |

## The axes

A small, near-orthogonal set distilled from common design taxonomies (merging
redundant pairs like density/whitespace). Each is bipolar, scored −100…+100.

| Axis | − pole | + pole |
| --- | --- | --- |
| Tone | Light | Dark |
| Density | Airy | Packed |
| Complexity | Minimal | Maximal |
| Saturation | Muted | Vivid |
| Temperature | Cool | Warm |
| Corners | Sharp | Rounded |
| Depth | Flat | Layered |
| Type contrast | Uniform | Dramatic |
| Type voice | Neutral | Expressive |
| Geometry | Geometric | Organic |
| Layout | Structured | Broken |
| Finish | Refined | Raw |

## Using the profile with Claude

Drop the exported brief where Claude Code will read it on every relevant prompt:

```
.claude/skills/aesthetic-profile/SKILL.md
```

Then generation requests inherit your taste instead of Claude's generic
defaults. You can also paste the **brief** into a Claude Design prompt, or hand
the **DTCG tokens** to a build step / design system. See `examples/` for what
the three artifacts look like.

## Customizing

- **References:** edit the archetypes in `src/data/references.ts`. Add a style by
  giving it a coherent 12-axis vector; its mockup renders automatically.
- **Axes:** change the vocabulary in `src/lib/axes.ts` (pole labels + the brief
  phrasing). Keep the set near-orthogonal — that's what makes the scores mean
  something.
- **Session length:** tune the default in `suggestedRounds` (`src/lib/pairing.ts`),
  ~6 appearances per reference. Comfortable under the fatigue ceiling.

## Roadmap

v2 added the conjoint part-worths; v3 added best–worst elicitation and
information-based stopping. Remaining:

- **Controlled single-axis pairs** for the 3–4 axes that matter most, to break
  residual confounding entirely.
- **Full D-optimal set selection** (ASAP-style) — v3 picks diverse, under-sampled
  grids; choosing each grid to directly minimize posterior variance would cut
  screens further still.
- **Real screenshots** + a vision-model auto-tagger with human QA, alongside the
  rendered stimuli.

## Prior art

The thesis — learn a person's visual taste from a handful of pairwise judgments
and emit a structured profile — is well supported: CMU's *"Learning Personal
Style from Few Examples"* (DIS '21), the broad pairwise image-aesthetics
literature (Bradley-Terry over hundreds of thousands of design ratings), and
aesthetic-profiling patents going back to 2000. The newest commercial cousin is
[Taste](https://buildwithtaste.com), which similarly publishes a `SKILL.md` + MCP
server for Claude Code.

## License

MIT.
