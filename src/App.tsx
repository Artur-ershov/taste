import { useEffect, useMemo, useState } from "react";
import { REFERENCES } from "./data/references";
import { Intro } from "./components/Intro";
import { GridPick } from "./components/GridPick";
import { AvoidStep } from "./components/AvoidStep";
import { BlindAB } from "./components/BlindAB";
import { Result } from "./components/Result";
import { ELO_BASE, updateElo } from "./lib/elo";
import { pickSet } from "./lib/pairing";
import { fitUtilityModel } from "./lib/utility";
import { buildProfile } from "./lib/profile";
import type { Comparison, Profile, Reference, Strength } from "./types";

type Stage = "intro" | "grid" | "avoid" | "validate" | "result";
const STORAGE_KEY = "taste.session.v6";
const GRID_N = 4;
const MIN_SCREENS = 10;
const MAX_SCREENS = 26;
const CONF_TARGET = 0.85;

function initStrengths(): Map<string, Strength> {
  return new Map(
    REFERENCES.map((r) => [r.id, { id: r.id, elo: ELO_BASE, bt: 0, comparisons: 0, wins: 0 }]),
  );
}

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

/** A best–worst screen expands into many implied pairwise constraints. */
function screenToComparisons(setIds: string[], best: string, worst: string | null): Comparison[] {
  const ts = Date.now();
  const out: Comparison[] = [];
  for (const x of setIds) if (x !== best) out.push({ winner: best, loser: x, ts });
  if (worst) for (const x of setIds) if (x !== best && x !== worst) out.push({ winner: x, loser: worst, ts });
  return out;
}

interface Saved {
  project: string;
  comparisons: Comparison[];
  screenSizes: number[];
}

export default function App() {
  const [stage, setStage] = useState<Stage>("intro");
  const [project, setProject] = useState("");
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [screenSizes, setScreenSizes] = useState<number[]>([]);
  const [currentSet, setCurrentSet] = useState<Reference[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [abScore, setAbScore] = useState<{ correct: number; total: number } | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);

  const byId = useMemo(() => new Map(REFERENCES.map((r) => [r.id, r])), []);
  const strengths = useMemo(() => replayStrengths(comparisons), [comparisons]);
  const model = useMemo(
    () => (comparisons.length >= 8 ? fitUtilityModel(REFERENCES, comparisons) : null),
    [comparisons],
  );
  const screens = screenSizes.length;
  const confidence = model?.confidence ?? 0;
  const canFinish = screens >= MIN_SCREENS;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Saved;
      if (s.comparisons?.length > 0) setSaved(s);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (stage === "grid" || stage === "avoid") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ project, comparisons, screenSizes }));
    } else if (stage === "result") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [stage, project, comparisons, screenSizes]);

  const nextSet = (comps: Comparison[], lastIds: string[]) =>
    pickSet(REFERENCES, replayStrengths(comps), GRID_N, lastIds);

  const start = (name: string) => {
    setSaved(null);
    setProject(name);
    setComparisons([]);
    setScreenSizes([]);
    setProfile(null);
    setCurrentSet(pickSet(REFERENCES, initStrengths(), GRID_N, []));
    setStage("grid");
  };

  const resume = () => {
    if (!saved) return;
    setProject(saved.project);
    setComparisons(saved.comparisons);
    setScreenSizes(saved.screenSizes);
    setCurrentSet(nextSet(saved.comparisons, []));
    setSaved(null);
    setStage("grid");
  };

  const onScreen = (bestId: string, worstId: string | null) => {
    const added = screenToComparisons(currentSet.map((r) => r.id), bestId, worstId);
    const comps = [...comparisons, ...added];
    const sizes = [...screenSizes, added.length];
    setComparisons(comps);
    setScreenSizes(sizes);

    const m = comps.length >= 8 ? fitUtilityModel(REFERENCES, comps) : null;
    const conf = m?.confidence ?? 0;
    const stop = sizes.length >= MAX_SCREENS || (sizes.length >= MIN_SCREENS && conf >= CONF_TARGET);
    if (stop) setStage("avoid");
    else setCurrentSet(nextSet(comps, currentSet.map((r) => r.id)));
  };

  const onSkip = () => setCurrentSet(nextSet(comparisons, currentSet.map((r) => r.id)));

  const onUndo = () => {
    if (!screenSizes.length) return;
    const last = screenSizes[screenSizes.length - 1];
    const comps = comparisons.slice(0, comparisons.length - last);
    const sizes = screenSizes.slice(0, -1);
    setComparisons(comps);
    setScreenSizes(sizes);
    setCurrentSet(nextSet(comps, []));
  };

  const finishNow = () => setStage("avoid");

  const avoidCandidates = useMemo(() => {
    if (stage !== "avoid") return [];
    return [...REFERENCES].sort((a, b) => strengths.get(a.id)!.elo - strengths.get(b.id)!.elo).slice(0, 6);
  }, [stage, strengths]);

  const onAvoidDone = (avoidIds: string[]) => {
    setProfile(buildProfile(REFERENCES, comparisons, strengths, avoidIds, project));
    setAbScore(null);
    setStage("validate");
  };

  const onValidateDone = (score: { correct: number; total: number }) => {
    setAbScore(score);
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
        <span className="badge">v6</span>
        <span className="topbar__tag">aesthetic-profiling picker</span>
      </header>

      <main className="main">
        {stage === "intro" && (
          <Intro
            onStart={start}
            saved={saved ? { screens: saved.screenSizes.length } : null}
            onResume={resume}
          />
        )}
        {stage === "grid" && currentSet.length > 0 && (
          <GridPick
            items={currentSet}
            screen={screens + 1}
            minScreens={MIN_SCREENS}
            confidence={confidence}
            canFinish={canFinish}
            onComplete={onScreen}
            onSkip={onSkip}
            onUndo={onUndo}
            onFinish={finishNow}
            canUndo={screens > 0}
          />
        )}
        {stage === "avoid" && <AvoidStep candidates={avoidCandidates} onDone={onAvoidDone} />}
        {stage === "validate" && profile && <BlindAB profile={profile} onDone={onValidateDone} />}
        {stage === "result" && profile && (
          <Result profile={profile} byId={byId} abScore={abScore} onRestart={restart} />
        )}
      </main>

      <footer className="footer">
        <span>
          Best–worst grids + conjoint logit · {REFERENCES.length} balanced &amp; decorrelated references across 16 axes · in your browser
        </span>
      </footer>
    </div>
  );
}
