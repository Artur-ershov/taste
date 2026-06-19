import { useState } from "react";
import { suggestedRounds } from "../lib/pairing";

interface Props {
  referenceCount: number;
  onStart: (project: string, rounds: number) => void;
}

export function Intro({ referenceCount, onStart }: Props) {
  const suggested = suggestedRounds(referenceCount);
  const [project, setProject] = useState("");
  const [rounds, setRounds] = useState(suggested);

  return (
    <section className="intro">
      <h1 className="intro__title">Taste</h1>
      <p className="intro__lede">
        A pairwise picker that turns your eye into a Claude-ready aesthetic profile. Compare design
        references two at a time; we rank them with Elo + Bradley-Terry and export axis scores,
        W3C design tokens, and a <code>SKILL.md</code> brief.
      </p>

      <ol className="intro__steps">
        <li>
          <strong>Compare</strong> ~{rounds} pairs of {referenceCount} references — pick the one that
          feels more right.
        </li>
        <li>
          <strong>Flag</strong> any styles you actively want to avoid.
        </li>
        <li>
          <strong>Export</strong> your profile: axis scores, DTCG tokens, and a SKILL.md for Claude.
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

        <label className="field">
          <span>
            Comparisons: <strong>{rounds}</strong>{" "}
            <small>(~{Math.max(1, Math.round((rounds * 4) / 60))} min)</small>
          </span>
          <input
            type="range"
            min={Math.max(10, Math.round(suggested / 2))}
            max={suggested * 2}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
          />
        </label>

        <button className="btn btn--primary" onClick={() => onStart(project, rounds)}>
          Start →
        </button>
      </div>

      <p className="intro__note">
        Tip: use <kbd>←</kbd> / <kbd>→</kbd> to pick and <kbd>space</kbd> to skip. Everything runs in
        your browser — nothing is uploaded.
      </p>
    </section>
  );
}
