import { useMemo, useState } from "react";
import type { Profile, Reference } from "../types";
import { AXIS_BY_ID } from "../lib/axes";
import { buildBriefText, buildBundleJson, buildSkillMd } from "../lib/brief";
import { buildTokens } from "../lib/tokens";
import { vectorFromScores } from "../lib/render";
import { StimulusCard } from "./StimulusCard";

type Tab = "brief" | "axes" | "tokens" | "skill";

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
    const brief = buildBriefText(profile, byId);
    const bundle = buildBundleJson(profile, byId);
    const tokens = buildTokens(profile.axes).dtcg;
    const skill = buildSkillMd(profile, byId);
    return {
      brief,
      bundleJson: JSON.stringify(bundle, null, 2),
      axesJson: JSON.stringify(bundle.axes, null, 2),
      tokensJson: JSON.stringify(tokens, null, 2),
      skill,
    };
  }, [profile, byId]);

  const tabContent: Record<Tab, string> = {
    brief: artifacts.brief,
    axes: artifacts.axesJson,
    tokens: artifacts.tokensJson,
    skill: artifacts.skill,
  };

  const copy = async () => {
    await navigator.clipboard.writeText(tabContent[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const profileVector = vectorFromScores(profile.axes);

  return (
    <section className="result">
      <header className="result__head">
        <div>
          <p className="result__eyebrow">Aesthetic profile</p>
          <h2 className="result__title">{profile.meta.project}</h2>
          <p className="result__sub">
            {profile.meta.comparisons} comparisons · {profile.meta.referenceCount} references
          </p>
        </div>
        <button className="btn btn--ghost" onClick={onRestart}>
          ↻ New session
        </button>
      </header>

      <div className="result__cols">
        <div className="panel panel--synth">
          <h3>Your synthesized style</h3>
          <p className="panel__hint">A mockup rendered from your axis scores.</p>
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
                  <div className="axis__val">
                    {a.value > 0 ? "+" : ""}
                    {a.value}
                    {low && <span className="axis__low"> · low conf.</span>}
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
            {(["brief", "axes", "tokens", "skill"] as Tab[]).map((t) => (
              <button key={t} className={`tab${tab === t ? " tab--on" : ""}`} onClick={() => setTab(t)}>
                {t === "brief" ? "Brief" : t === "axes" ? "Axis JSON" : t === "tokens" ? "Tokens" : "SKILL.md"}
              </button>
            ))}
          </div>
        </div>

        <pre className="export__code">{tabContent[tab]}</pre>

        <div className="export__actions">
          <button className="btn btn--primary" onClick={copy}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
          <button className="btn btn--ghost" onClick={() => download("aesthetic-profile.json", artifacts.bundleJson, "application/json")}>
            ↓ profile.json
          </button>
          <button className="btn btn--ghost" onClick={() => download("design.tokens.json", artifacts.tokensJson, "application/design-tokens+json")}>
            ↓ design.tokens.json
          </button>
          <button className="btn btn--ghost" onClick={() => download("SKILL.md", artifacts.skill, "text/markdown")}>
            ↓ SKILL.md
          </button>
        </div>
      </div>
    </section>
  );
}
