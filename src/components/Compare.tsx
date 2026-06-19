import { useEffect } from "react";
import type { Reference } from "../types";
import { StimulusCard } from "./StimulusCard";

interface Props {
  pair: [Reference, Reference];
  round: number;
  total: number;
  onPick: (winner: string, loser: string) => void;
  onSkip: () => void;
}

export function Compare({ pair, round, total, onPick, onSkip }: Props) {
  const [left, right] = pair;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "1") onPick(left.id, right.id);
      else if (e.key === "ArrowRight" || e.key === "2") onPick(right.id, left.id);
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [left, right, onPick, onSkip]);

  const pct = Math.round((round / total) * 100);

  return (
    <section className="compare">
      <div className="compare__head">
        <p className="compare__prompt">Which feels more right?</p>
        <div className="progress" aria-label={`Comparison ${round + 1} of ${total}`}>
          <div className="progress__bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="compare__count">
          {Math.min(round + 1, total)} / {total}
        </p>
      </div>

      <div className="compare__grid">
        <button className="pick" onClick={() => onPick(left.id, right.id)} aria-label={`Pick ${left.name}`}>
          <StimulusCard reference={left} />
          <kbd className="pick__key">←</kbd>
        </button>

        <div className="compare__vs" aria-hidden>
          vs
        </div>

        <button className="pick" onClick={() => onPick(right.id, left.id)} aria-label={`Pick ${right.name}`}>
          <StimulusCard reference={right} />
          <kbd className="pick__key">→</kbd>
        </button>
      </div>

      <div className="compare__foot">
        <button className="btn btn--ghost" onClick={onSkip}>
          Hard to tell — skip <kbd>space</kbd>
        </button>
      </div>
    </section>
  );
}
