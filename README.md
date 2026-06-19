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
intro ─▶ compare (2AFC × ~N) ─▶ flag styles to avoid ─▶ profile + export
```

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

This is the recommended "Stage 1" build. Natural next steps:

- **Per-axis part-worths** via a discrete-choice (logit) regression on the tags,
  for defensible per-attribute weights rather than averaged tags.
- **Controlled single-axis pairs** for the 3–4 axes that matter most, to break
  residual confounding.
- **Full active sampling** (Crowd-BT / ASAP) to cut session length further.
- **Real screenshots** + a vision-model auto-tagger with human QA, if you want
  organic stimuli alongside the rendered ones.

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
