import { useState } from "react";
import type { Reference } from "../types";
import { StimulusCard } from "./StimulusCard";

interface Props {
  candidates: Reference[];
  onDone: (avoidIds: string[]) => void;
}

export function AvoidStep({ candidates, onDone }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="avoid">
      <h2 className="avoid__title">Anything to actively avoid?</h2>
      <p className="avoid__lede">
        These ranked lowest for you. Tap any that are a hard “no” — they become explicit
        anti-references in your profile. Optional.
      </p>

      <div className="avoid__grid">
        {candidates.map((r) => {
          const on = selected.has(r.id);
          return (
            <button
              key={r.id}
              className={`avoid__item${on ? " avoid__item--on" : ""}`}
              onClick={() => toggle(r.id)}
              aria-pressed={on}
            >
              <StimulusCard reference={r} />
              <span className="avoid__label">
                {on ? "✕ Avoid" : r.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="avoid__foot">
        <button className="btn btn--ghost" onClick={() => onDone([])}>
          Skip
        </button>
        <button className="btn btn--primary" onClick={() => onDone([...selected])}>
          Build profile → {selected.size > 0 && `(avoiding ${selected.size})`}
        </button>
      </div>
    </section>
  );
}
