import { useMemo, useState } from "react";
import type { AxisVector, Profile } from "../types";
import { vectorFromScores } from "../lib/render";
import { StimulusCard } from "./StimulusCard";

// Blind end-to-end check: show the profile-styled design against a foil that
// violates the user's key drivers, unlabeled, and ask "which feels more you?".
// If they reliably pick their profile, the whole pipeline (axes → tokens → felt
// design) genuinely captures their taste — the threshold the research flags.

const clamp = (v: number) => Math.max(-100, Math.min(100, v));

function foilOf(profile: Profile): AxisVector {
  const f = { ...vectorFromScores(profile.axes) } as AxisVector;
  const strong = profile.drivers.filter((d) => d.importance >= 0.25).slice(0, 4);
  const flip = strong.length >= 2 ? strong : profile.drivers.slice(0, 3);
  for (const d of flip) f[d.id] = clamp(-(d.weight >= 0 ? 1 : -1) * 70);
  return f;
}

export function BlindAB({
  profile,
  rounds = 3,
  onDone,
}: {
  profile: Profile;
  rounds?: number;
  onDone: (score: { correct: number; total: number }) => void;
}) {
  const profileAxes = useMemo(() => vectorFromScores(profile.axes), [profile]);
  const foilAxes = useMemo(() => foilOf(profile), [profile]);
  // Fixed per-round layout: is the profile on the left?
  const layout = useMemo(
    () => Array.from({ length: rounds }, () => Math.random() < 0.5),
    [rounds],
  );

  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);

  const choose = (pickedProfile: boolean) => {
    const c = correct + (pickedProfile ? 1 : 0);
    if (round + 1 >= rounds) onDone({ correct: c, total: rounds });
    else {
      setCorrect(c);
      setRound(round + 1);
    }
  };

  const profileLeft = layout[round];
  const leftAxes = profileLeft ? profileAxes : foilAxes;
  const rightAxes = profileLeft ? foilAxes : profileAxes;

  return (
    <section className="compare">
      <div className="compare__head">
        <p className="compare__prompt">Which feels more like you?</p>
        <p className="grid-pick__meta">
          Quick blind check · {round + 1} / {rounds}
        </p>
      </div>

      <div className="compare__grid">
        <button className="pick" onClick={() => choose(profileLeft)} aria-label="Pick left">
          <StimulusCard axes={leftAxes} variant={round + 1} />
        </button>
        <div className="compare__vs" aria-hidden>
          or
        </div>
        <button className="pick" onClick={() => choose(!profileLeft)} aria-label="Pick right">
          <StimulusCard axes={rightAxes} variant={round + 1} />
        </button>
      </div>

      <div className="compare__foot">
        <button className="btn btn--ghost" onClick={() => choose(false)}>
          Skip — no difference
        </button>
      </div>
    </section>
  );
}
