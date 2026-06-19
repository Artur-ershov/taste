import { useMemo, useState } from "react";
import type { Profile, Reference } from "../types";
import { AXIS_BY_ID } from "../lib/axes";
import { buildBriefText, buildBundleJson, buildSkillMd, buildClaudePrompt, buildCssVars } from "../lib/brief";
import { buildTokens } from "../lib/tokens";
import { vectorFromScores } from "../lib/render";
import { StimulusCard } from "./StimulusCard";
import { Radar } from "./Radar";

type Tab = "brief" | "axes" | "tokens" | "skill" | "claude" | "css";

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

export function Result({
  profile,
  byId,
  onRestart,
}: {
  profile: Profile;
  byId: Map<string, Reference>;
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
    };
  }, [profile, byId]);

  const tabContent: Record<Tab, string> = {
    brief: artifacts.brief,
    axes: artifacts.axesJson,
    tokens: artifacts.tokensJson,
    skill: artifacts.skill,
    claude: artifacts.claude,
    css: artifacts.css,
  };

  const copy = async () => {
    await navigator.clipboard.writeText(tabContent[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const profileVector = vectorFromScores(profile.axes);
  const topDrivers = profile.drivers.filter((d) => d.importance >= 0.15).slice(0, 7);

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

      <div className="result__cols">
        <div className="panel panel--synth">
          <h3>Your synthesized style</h3>
          <p className="panel__hint">A live mockup rendered from your axis scores.</p>
          <div className="synth__card">
            <StimulusCard axes={profileVector} />
          </div>
        </div>

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
      </div>

      <div className="panel">
        <h3>What drives your taste</h3>
        <p className="panel__hint">
          Per-axis weights from a conjoint logit model — how much each axis actually decided your picks.
        </p>
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
          <button className="btn btn--ghost" onClick={() => download("taste.css", artifacts.css, "text/css")}>
            ↓ taste.css
          </button>
        </div>
      </div>
    </section>
  );
}
