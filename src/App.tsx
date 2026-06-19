import { useMemo, useState } from "react";
import { REFERENCES } from "./data/references";
import { Intro } from "./components/Intro";
import { Compare } from "./components/Compare";
import { AvoidStep } from "./components/AvoidStep";
import { Result } from "./components/Result";
import { ELO_BASE, updateElo } from "./lib/elo";
import { nextPair } from "./lib/pairing";
import { buildProfile } from "./lib/profile";
import type { Comparison, Profile, Reference, Strength } from "./types";

type Stage = "intro" | "compare" | "avoid" | "result";

function initStrengths(): Map<string, Strength> {
  return new Map(
    REFERENCES.map((r) => [r.id, { id: r.id, elo: ELO_BASE, bt: 0, comparisons: 0, wins: 0 }]),
  );
}

export default function App() {
  const [stage, setStage] = useState<Stage>("intro");
  const [project, setProject] = useState("");
  const [total, setTotal] = useState(0);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [strengths, setStrengths] = useState<Map<string, Strength>>(initStrengths);
  const [pair, setPair] = useState<[Reference, Reference] | null>(null);
  const [lastPair, setLastPair] = useState<[string, string] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const byId = useMemo(() => new Map(REFERENCES.map((r) => [r.id, r])), []);

  const start = (name: string, rounds: number) => {
    const fresh = initStrengths();
    setProject(name);
    setTotal(rounds);
    setComparisons([]);
    setStrengths(fresh);
    setLastPair(null);
    setProfile(null);
    setPair(nextPair(REFERENCES, fresh, null));
    setStage("compare");
  };

  const onPick = (winner: string, loser: string) => {
    const next = new Map(strengths);
    const w = { ...next.get(winner)! };
    const l = { ...next.get(loser)! };
    const [nw, nl] = updateElo(w.elo, l.elo, true);
    w.elo = nw;
    l.elo = nl;
    w.comparisons += 1;
    l.comparisons += 1;
    w.wins += 1;
    next.set(winner, w);
    next.set(loser, l);

    const comps = [...comparisons, { winner, loser, ts: Date.now() }];
    setStrengths(next);
    setComparisons(comps);
    setLastPair([winner, loser]);

    if (comps.length >= total) setStage("avoid");
    else setPair(nextPair(REFERENCES, next, [winner, loser]));
  };

  const onSkip = () => setPair(nextPair(REFERENCES, strengths, lastPair));

  const avoidCandidates = useMemo(() => {
    if (stage !== "avoid") return [];
    return [...REFERENCES]
      .sort((a, b) => (strengths.get(a.id)!.elo - strengths.get(b.id)!.elo))
      .slice(0, 6);
  }, [stage, strengths]);

  const onAvoidDone = (avoidIds: string[]) => {
    setProfile(buildProfile(REFERENCES, comparisons, strengths, avoidIds, project));
    setStage("result");
  };

  const restart = () => setStage("intro");

  return (
    <div className="app">
      <header className="topbar">
        <span className="wordmark">Taste</span>
        <span className="topbar__tag">aesthetic-profiling picker</span>
      </header>

      <main className="main">
        {stage === "intro" && <Intro referenceCount={REFERENCES.length} onStart={start} />}
        {stage === "compare" && pair && (
          <Compare pair={pair} round={comparisons.length} total={total} onPick={onPick} onSkip={onSkip} />
        )}
        {stage === "avoid" && <AvoidStep candidates={avoidCandidates} onDone={onAvoidDone} />}
        {stage === "result" && profile && <Result profile={profile} byId={byId} onRestart={restart} />}
      </main>

      <footer className="footer">
        <span>
          Built for Claude Design · Elo + Bradley-Terry over {REFERENCES.length} references · runs
          entirely in your browser
        </span>
      </footer>
    </div>
  );
}
