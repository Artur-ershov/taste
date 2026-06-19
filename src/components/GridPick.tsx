import { useEffect, useState } from "react";
import type { Reference } from "../types";
import { StimulusCard } from "./StimulusCard";

interface Props {
  items: Reference[];
  screen: number;
  minScreens: number;
  confidence: number; // 0..1 model readiness
  canFinish: boolean;
  onComplete: (bestId: string, worstId: string | null) => void;
  onSkip: () => void;
  onUndo: () => void;
  onFinish: () => void;
  canUndo: boolean;
}

export function GridPick({
  items,
  screen,
  minScreens,
  confidence,
  canFinish,
  onComplete,
  onSkip,
  onUndo,
  onFinish,
  canUndo,
}: Props) {
  const [phase, setPhase] = useState<"best" | "worst">("best");
  const [best, setBest] = useState<string | null>(null);

  // Reset when a new screen of items arrives.
  useEffect(() => {
    setPhase("best");
    setBest(null);
  }, [items]);

  const choose = (id: string) => {
    if (phase === "best") {
      setBest(id);
      setPhase("worst");
    } else if (id !== best) {
      onComplete(best!, id);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= items.length) choose(items[n - 1].id);
      else if (e.key === "z" && canUndo) onUndo();
      else if (e.key === "s") onSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const pct = Math.round(confidence * 100);

  return (
    <section className="grid-pick">
      <div className="grid-pick__head">
        <p className="grid-pick__prompt">
          {phase === "best" ? "Which do you like the most?" : "And which do you like the least?"}
        </p>
        <div className="confidence" aria-label={`Profile confidence ${pct}%`}>
          <div className="confidence__bar" style={{ width: `${Math.max(4, pct)}%` }} />
        </div>
        <p className="grid-pick__meta">
          Profile confidence {pct}% · screen {screen}
          {screen < minScreens ? ` (min ${minScreens})` : ""}
        </p>
      </div>

      <div className="grid2">
        {items.map((r, i) => {
          const isBest = best === r.id;
          const locked = phase === "worst" && isBest;
          return (
            <button
              key={r.id}
              className={`tile${isBest ? " tile--best" : ""}${locked ? " tile--locked" : ""}`}
              onClick={() => choose(r.id)}
              disabled={locked}
              aria-label={`${r.name}${isBest ? " (most liked)" : ""}`}
            >
              <StimulusCard reference={r} />
              <kbd className="tile__key">{i + 1}</kbd>
              {isBest && <span className="tile__badge tile__badge--best">♥ Most</span>}
            </button>
          );
        })}
      </div>

      <div className="grid-pick__foot">
        <button className="btn btn--ghost" onClick={onUndo} disabled={!canUndo}>
          ← Undo <kbd>z</kbd>
        </button>
        {phase === "worst" && (
          <button className="btn btn--ghost" onClick={() => onComplete(best!, null)}>
            Only a favourite
          </button>
        )}
        <button className="btn btn--ghost" onClick={onSkip}>
          Skip <kbd>s</kbd>
        </button>
        {canFinish && (
          <button className="btn btn--primary" onClick={onFinish}>
            Finish & build profile →
          </button>
        )}
      </div>
    </section>
  );
}
