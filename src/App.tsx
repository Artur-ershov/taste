import { useEffect, useMemo, useState } from "react";
import { REFERENCES } from "./data/references";
import { Intro } from "./components/Intro";
import { Compare } from "./components/Compare";
import { AvoidStep } from "./components/AvoidStep";
import { Result } from "./components/Result";
import { ELO_BASE, updateElo } from "./lib/elo";
import { nextPair } from "./lib/pairing";
import { fitUtilityModel } from "./lib/utility";
import { buildProfile } from "./lib/profile";
import type { Comparison, Profile, Reference, Strength } from "./types";

type Stage = "intro" | "compare" | "avoid" | "result";
const STORAGE_KEY = "taste.session.v2";

function initStrengths(): Map<string, Strength> {
  return new Map(
    REFERENCES.map((r) => [r.id, { id: r.id, elo: ELO_BASE, bt: 0, comparisons: 0, wins: 0 }]),
  );
}

/** Rebuild Elo strengths by replaying the comparison log (source of truth). */
function replayStrengths(comps: Comparison[]): Map<string, Strength> {
  const s = initStrengths();
  for (const c of comps) {
    const w = s.get(c.winner);
    const l = s.get(c.loser);
    if (!w || !l) continue;
    const [nw, nl] = updateElo(w.elo, l.elo, true);
    w.elo = nw;
    l.elo = nl;
    w.comparisons += 1;
    l.comparisons += 1;
    w.wins += 1;
  }
  return s;
}

interface Saved {
  project: string;
  total: number;
  comparisons: Comparison[];
}

export default function App() {
  const [stage, setStage] = useState<Stage>("intro");
  const [project, setProject] = useState("");
  const [total, setTotal] = useState(0);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [pair, setPair] = useState<[Reference, Reference] | null>(null);
  const [lastPair, setLastPair] = useState<[string, string] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);

  const byId = useMemo(() => new Map(REFERENCES.map((r) => [r.id, r])), []);
  const strengths = useMemo(() => replayStrengths(comparisons), [comparisons]);

  // Load any in-progress session once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Saved;
      if (s.comparisons?.length > 0 && s.comparisons.length < s.total) setSaved(s);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist while a session is in progress; clear it otherwise.
  useEffect(() => {
    if (stage === "compare" || stage === "avoid") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ project, total, comparisons }));
    } else if (stage === "result") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [stage, project, total, comparisons]);

  /** Compute the next pair given a comparison log (fits the model after warmup). */
  const advance = (comps: Comparison[], last: [string, string] | null) => {
    const s = replayStrengths(comps);
    const model = comps.length >= 8 ? fitUtilityModel(REFERENCES, comps) : null;
    return nextPair(REFERENCES, s, last, model);
  };

  const start = (name: string, rounds: number) => {
    setSaved(null);
    setProject(name);
    setTotal(rounds);
    setComparisons([]);
    setLastPair(null);
    setProfile(null);
    setPair(nextPair(REFERENCES, initStrengths(), null, null));
    setStage("compare");
  };

  const resume = () => {
    if (!saved) return;
    setProject(saved.project);
    setTotal(saved.total);
    setComparisons(saved.comparisons);
    const last = saved.comparisons.length
      ? ([saved.comparisons[saved.comparisons.length - 1].winner, saved.comparisons[saved.comparisons.length - 1].loser] as [string, string])
      : null;
    setLastPair(last);
    setPair(advance(saved.comparisons, last));
    setSaved(null);
    setStage("compare");
  };

  const onPick = (winner: string, loser: string) => {
    const comps = [...comparisons, { winner, loser, ts: Date.now() }];
    setComparisons(comps);
    setLastPair([winner, loser]);
    if (comps.length >= total) setStage("avoid");
    else setPair(advance(comps, [winner, loser]));
  };

  const onSkip = () => setPair(advance(comparisons, lastPair));

  const onUndo = () => {
    if (!comparisons.length) return;
    const comps = comparisons.slice(0, -1);
    setComparisons(comps);
    setLastPair(null);
    setPair(advance(comps, null));
  };

  const avoidCandidates = useMemo(() => {
    if (stage !== "avoid") return [];
    return [...REFERENCES].sort((a, b) => strengths.get(a.id)!.elo - strengths.get(b.id)!.elo).slice(0, 6);
  }, [stage, strengths]);

  const onAvoidDone = (avoidIds: string[]) => {
    setProfile(buildProfile(REFERENCES, comparisons, strengths, avoidIds, project));
    setStage("result");
  };

  const restart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSaved(null);
    setStage("intro");
  };

  return (
    <div className="app">
      <header className="topbar">
        <span className="wordmark">Taste</span>
        <span className="badge">v2</span>
        <span className="topbar__tag">aesthetic-profiling picker</span>
      </header>

      <main className="main">
        {stage === "intro" && (
          <Intro
            referenceCount={REFERENCES.length}
            onStart={start}
            saved={saved ? { count: saved.comparisons.length, total: saved.total } : null}
            onResume={resume}
          />
        )}
        {stage === "compare" && pair && (
          <Compare
            pair={pair}
            round={comparisons.length}
            total={total}
            onPick={onPick}
            onSkip={onSkip}
            onUndo={onUndo}
            canUndo={comparisons.length > 0}
          />
        )}
        {stage === "avoid" && <AvoidStep candidates={avoidCandidates} onDone={onAvoidDone} />}
        {stage === "result" && profile && <Result profile={profile} byId={byId} onRestart={restart} />}
      </main>

      <footer className="footer">
        <span>
          Conjoint logit + Elo/Bradley-Terry over {REFERENCES.length} references · adaptive pairing ·
          runs entirely in your browser
        </span>
      </footer>
    </div>
  );
}
