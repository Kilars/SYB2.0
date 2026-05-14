import { useEffect, useRef, useState } from "react";

/** Named PodiumPlayer to avoid colliding with the global Player type. */
export type PodiumPlayer = {
  userId: string;
  displayName: string;
  imageUrl?: string;
  isGuest?: boolean;
};

export type PodiumRank = 1 | 2 | 3 | 4;

export type PodiumRules = {
  requireFullPodium: boolean;
  allowWinnerOnly: boolean;
};

type UsePodiumStateArgs = {
  playerCount: 2 | 3 | 4;
  value: Map<PodiumRank, string | null>;
  onChange: (next: Map<PodiumRank, string | null>) => void;
  rules: PodiumRules;
  /** MUST be a stable reference when content is unchanged — memoize in the parent, or the participant-change effect fires spuriously. */
  players: PodiumPlayer[];
};

export type UsePodiumStateReturn = {
  activeRank: PodiumRank | null;
  assign: (userId: string) => void;
  unassign: (rank: PodiumRank) => void;
  setActiveRank: (rank: PodiumRank | null) => void;
  isComplete: boolean;
};

export function usePodiumState({
  playerCount,
  value,
  onChange,
  rules,
  players,
}: UsePodiumStateArgs): UsePodiumStateReturn {
  const [activeRank, setActiveRank] = useState<PodiumRank | null>(() => firstUnfilled(value, playerCount));

  // Refs hold the latest value/onChange so effects keyed on playerCount/players
  // don't fire when value flips. Without this, exhaustive-deps would force the
  // effects to re-run on every onChange, which would resurrect cleared placements.
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const prevPlayerCountRef = useRef(playerCount);
  const prevPlayersRef = useRef(players);

  useEffect(() => {
    const prevCount = prevPlayerCountRef.current;
    prevPlayerCountRef.current = playerCount;
    if (playerCount >= prevCount) return;

    const current = valueRef.current;
    let dirty = false;
    const next = new Map(current);
    for (let r = playerCount + 1; r <= 4; r++) {
      const rank = r as PodiumRank;
      if (next.get(rank)) {
        next.set(rank, null);
        dirty = true;
      }
    }
    if (dirty) onChangeRef.current(next);

    setActiveRank((prev) =>
      prev !== null && prev > playerCount ? firstUnfilled(next, playerCount) : prev,
    );
  }, [playerCount]);

  useEffect(() => {
    const prevPlayers = prevPlayersRef.current;
    prevPlayersRef.current = players;
    if (prevPlayers === players) return;

    const currentIds = new Set(players.map((p) => p.userId));
    const current = valueRef.current;
    let dirty = false;
    const next = new Map(current);
    for (let r = 1; r <= 4; r++) {
      const rank = r as PodiumRank;
      const placed = next.get(rank);
      if (placed && !currentIds.has(placed)) {
        next.set(rank, null);
        dirty = true;
      }
    }
    if (dirty) onChangeRef.current(next);
  }, [players]);

  const assign = (userId: string) => {
    if (activeRank === null || activeRank > playerCount) return;

    const next = new Map(value);
    for (let r = 1; r <= 4; r++) {
      const rank = r as PodiumRank;
      if (next.get(rank) === userId) next.set(rank, null);
    }
    next.set(activeRank, userId);
    onChange(next);

    const nextRank =
      firstUnfilled(next, playerCount, activeRank + 1) ?? firstUnfilled(next, playerCount);
    setActiveRank(nextRank);
  };

  const unassign = (rank: PodiumRank) => {
    if (rank > playerCount) return;
    const next = new Map(value);
    next.set(rank, null);
    onChange(next);
    setActiveRank(rank);
  };

  let filledCount = 0;
  for (let r = 1; r <= playerCount; r++) {
    if (value.get(r as PodiumRank)) filledCount++;
  }
  const isComplete =
    rules.allowWinnerOnly && !rules.requireFullPodium
      ? !!value.get(1)
      : filledCount === playerCount;

  return { activeRank, assign, unassign, setActiveRank, isComplete };
}

function firstUnfilled(
  value: Map<PodiumRank, string | null>,
  playerCount: 2 | 3 | 4,
  from = 1,
): PodiumRank | null {
  for (let r = from; r <= playerCount; r++) {
    const rank = r as PodiumRank;
    if (!value.get(rank)) return rank;
  }
  return null;
}
