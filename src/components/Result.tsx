import { useMemo, useState } from "react";
import type { Profile, Reference } from "../types";
import { AXIS_BY_ID } from "../lib/axes";
import {
  buildBriefText,
  buildBundleJson,
  buildSkillMd,
  buildClaudePrompt,
  buildCssVars,
  buildTailwindTheme,
  buildShadcnTheme,
} from "../lib/brief";
import { buildTokens } from "../lib/tokens";
import { vectorFromScores } from "../lib/render";
import { StimulusCard } from "./StimulusCard";
import { PreviewGallery } from "./PreviewGallery";
import { Radar } from "./Radar";

type Tab = "brief" | "claude" | "skill" | "tokens" | "tailwind" | "shadcn" | "css" | "axes";

function download(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function MiniRef({ r }: { r: Reference }) {
  return (
    <div className="mini">
      <div className="mini__card">
        <StimulusCard reference={r} />
      </div>
      <div className="mini__meta">
        <strong>{r.name}</strong>
        <span>{r.family}</span>
      </div>
    </div>
  );
}

const verdict = (x: number) => (x >= 0.7 ? "good" : x >= 0.58 ? "mid" : "weak");

export function Result({
  profile,
  byId,
  abScore,
  onRestart,
}: {
  profile: Profile;
  byId: Map<string, Reference>;
  abScore: { correct: number; total: number } | null;
  onRestart: () => void;
}) {
  const [tab, setTab] = useState<Tab>("brief");
  const [copied, setCopied] = useState(false);

  const artifacts = useMemo(() => {
    const bundle = buildBundleJson(profile, byId);
    return {
      brief: buildBriefText(profile, byId),
      bundleJson: JSON.stringify(bundle, null, 2),
      axesJson: JSON.stringify({ axes: bundle.axes, drivers: bundle.drivers }, null, 2),
      tokensJson: JSON.stringify(buildTokens(profile.axes).dtcg, null, 2),
      skill: buildSkillMd(profile, byId),
      claude: buildClaudePrompt(profile, byId),
      css: buildCssVars(profile),
      tailwind: buildTailwindTheme(profile),
      shadcn: buildShadcnTheme(profile),
    };
  }, [profile, byId]);

  const tabContent: Record<Tab, string> = {
    brief: artifacts.brief,
    claude: artifacts.claude,
    skill: artifacts.skill,
    tokens: artifacts.tokensJson,
    tailwind: artifacts.tailwind,
    shadcn: artifacts.shadcn,
    css: artifacts.css,
    axes: artifacts.axesJson,
  };

  const copy = async () => {
    await navigator.clipboard.writeText(tabContent[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const profileVector = vectorFromScores(profile.axes);
  const topDrivers = profile.drivers.filter((d) => d.importance >= 0.15).slice(0, 7);

  const [dark, setDark] = useState(profileVector.tone > 0);
  const previewAxes = { ...profileVector, tone: dark ? 55 : -55 };

  const v = profile.validation;
  const abRatio = abScore && abScore.total ? abScore.correct / abScore.total : null;

  return (
    <section className="result">
      <header className="result__head">
        <div>
          <p className="result__eyebrow">Aesthetic profile</p>
          <h2 className="result__title">{profile.meta.project}</h2>
          <p className="result__sub">
            {profile.meta.comparisons} comparisons · {profile.meta.referenceCount} references ·{" "}
            {Math.round(profile.consistency * 100)}% pick consistency
          </p>
        </div>
        <button className="btn btn--ghost" onClick={onRestart}>
          ↻ New session
        </button>
      </header>

      {/* validation */}
      <div className="panel">
        <h3>Does this profile actually capture your taste?</h3>
        <div className="validation">
          <div className="vstat">
            <span className="vstat__label">Held-out accuracy</span>
            {v ? (
              <>
                <span className={`vstat__num vstat__num--${verdict(v.heldOut)}`}>{Math.round(v.heldOut * 100)}%</span>
                <span className="vstat__hint">
                  predicts {v.n} unseen choices · 50% = chance{v.train - v.heldOut > 0.12 ? " · some overfit" : ""}
                </span>
              </>
            ) : (
              <span className="vstat__hint">too few judgments to cross-validate</span>
            )}
          </div>
          <div className="vstat">
            <span className="vstat__label">Blind A/B — “more you”</span>
            {abRatio !== null ? (
              <>
                <span className={`vstat__num vstat__num--${verdict(abRatio)}`}>
                  {abScore!.correct}/{abScore!.total}
                </span>
                <span className="vstat__hint">
                  you picked your profiled design over a foil that breaks your key axes
                </span>
              </>
            ) : (
              <span className="vstat__hint">skipped</span>
            )}
          </div>
        </div>
      </div>

      {/* preview */}
      <div className="panel">
        <div className="preview__head">
          <div>
            <h3>Your taste, applied</h3>
            <p className="panel__hint">A page and real components rendered from your tokens.</p>
          </div>
          <div className="toggle" role="group" aria-label="Theme">
            <button className={`toggle__btn${!dark ? " toggle__btn--on" : ""}`} onClick={() => setDark(false)}>
              Light
            </button>
            <button className={`toggle__btn${dark ? " toggle__btn--on" : ""}`} onClick={() => setDark(true)}>
              Dark
            </button>
          </div>
        </div>
        <div className="preview">
          <div className="preview__page">
            <StimulusCard axes={previewAxes} />
          </div>
          <div className="preview__kit">
            <PreviewGallery axes={previewAxes} />
          </div>
        </div>
      </div>

      <div className="result__cols">
        <div className="panel">
          <h3>Axis profile</h3>
          <div className="axes">
            {profile.axes.map((a) => {
              const def = AXIS_BY_ID[a.id];
              const left = a.value < 0 ? 50 + a.value / 2 : 50;
              const width = Math.abs(a.value) / 2;
              const low = a.confidence < 0.45;
              return (
                <div className="axis" key={a.id} style={{ opacity: low ? 0.6 : 1 }}>
                  <div className="axis__poles">
                    <span>{def.lowPole}</span>
                    <span className="axis__name">{def.label}</span>
                    <span>{def.highPole}</span>
                  </div>
                  <div className="axis__track">
                    <div className="axis__center" />
                    <div className="axis__fill" style={{ left: `${left}%`, width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <h3>What drives your taste</h3>
          <p className="panel__hint">Conjoint part-worths — how much each axis decided your picks.</p>
          <div className="drivers">
            <div className="drivers__radar">
              <Radar drivers={profile.drivers} />
            </div>
            <div className="drivers__list">
              {topDrivers.map((d) => {
                const def = AXIS_BY_ID[d.id];
                const pole = d.weight > 0 ? def.highPole : def.lowPole;
                return (
                  <div className="driver" key={d.id}>
                    <span className="driver__name">
                      {def.label} → <strong>{pole}</strong>
                    </span>
                    <div className="driver__track">
                      <div className="driver__fill" style={{ width: `${Math.round(d.importance * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="result__refs">
        <div className="panel">
          <h3>Emulate</h3>
          <div className="mini__row">
            {profile.emulate.map((id) => byId.get(id)).filter(Boolean).map((r) => (
              <MiniRef key={r!.id} r={r!} />
            ))}
          </div>
        </div>
        {profile.avoid.length > 0 && (
          <div className="panel">
            <h3>Avoid</h3>
            <div className="mini__row">
              {profile.avoid.map((id) => byId.get(id)).filter(Boolean).map((r) => (
                <MiniRef key={r!.id} r={r!} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="panel export">
        <div className="export__head">
          <h3>Export</h3>
          <div className="tabs">
            {(
              [
                ["brief", "Brief"],
                ["claude", "Claude prompt"],
                ["skill", "SKILL.md"],
                ["tokens", "Tokens"],
                ["tailwind", "Tailwind"],
                ["shadcn", "shadcn"],
                ["css", "CSS"],
                ["axes", "Axes"],
              ] as [Tab, string][]
            ).map(([t, label]) => (
              <button key={t} className={`tab${tab === t ? " tab--on" : ""}`} onClick={() => setTab(t)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <pre className="export__code">{tabContent[tab]}</pre>

        <div className="export__actions">
          <button className="btn btn--primary" onClick={copy}>
            {copied ? "Copied ✓" : "Copy current tab"}
          </button>
          <button className="btn btn--ghost" onClick={() => download("aesthetic-profile.json", artifacts.bundleJson, "application/json")}>
            ↓ profile.json
          </button>
          <button className="btn btn--ghost" onClick={() => download("design.tokens.json", artifacts.tokensJson, "application/design-tokens+json")}>
            ↓ tokens.json
          </button>
          <button className="btn btn--ghost" onClick={() => download("SKILL.md", artifacts.skill, "text/markdown")}>
            ↓ SKILL.md
          </button>
          <button className="btn btn--ghost" onClick={() => download("tailwind.config.js", artifacts.tailwind, "text/javascript")}>
            ↓ tailwind.config.js
          </button>
          <button className="btn btn--ghost" onClick={() => download("theme.css", artifacts.shadcn, "text/css")}>
            ↓ shadcn theme.css
          </button>
        </div>
      </div>
    </section>
  );
}
