import { useState } from "react";

interface Props {
  onStart: (project: string) => void;
  saved: { screens: number } | null;
  onResume: () => void;
}

export function Intro({ onStart, saved, onResume }: Props) {
  const [project, setProject] = useState("");

  return (
    <section className="intro">
      <h1 className="intro__title">Taste</h1>
      <p className="intro__lede">
        A picker that turns your eye into a Claude-ready aesthetic profile. Each screen shows four
        designs — pick the one you like <strong>most</strong> and the one you like{" "}
        <strong>least</strong>. That extracts far more signal per screen, so it takes only a handful
        of screens. We stop automatically once your profile is confident.
      </p>

      {saved && (
        <div className="resume">
          <span>You have a session in progress — {saved.screens} screens.</span>
          <button className="btn btn--primary" onClick={onResume}>
            Resume →
          </button>
        </div>
      )}

      <ol className="intro__steps">
        <li>
          <strong>Most & least</strong> of four designs per screen — best–worst scaling, ~5 implied
          comparisons each.
        </li>
        <li>
          <strong>Adaptive</strong> — the set adapts and we stop as soon as the conjoint weights are
          settled (usually ~12–16 screens).
        </li>
        <li>
          <strong>Export</strong> — axis scores, DTCG tokens, a SKILL.md and a paste-ready Claude
          prompt.
        </li>
      </ol>

      <div className="intro__form">
        <label className="field">
          <span>Project / client name</span>
          <input
            type="text"
            value={project}
            placeholder="e.g. Acme rebrand"
            onChange={(e) => setProject(e.target.value)}
          />
        </label>
        <button className="btn btn--primary" onClick={() => onStart(project)}>
          Start →
        </button>
      </div>

      <p className="intro__note">
        Tip: keys <kbd>1</kbd>–<kbd>4</kbd> select, <kbd>z</kbd> undoes, <kbd>s</kbd> skips.
        Everything runs in your browser — nothing is uploaded.
      </p>
    </section>
  );
}
