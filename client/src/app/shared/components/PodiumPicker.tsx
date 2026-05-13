import {
  Box,
  Button,
  Chip,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { PodiumPlayer, PodiumRank, PodiumRules, UsePodiumStateReturn } from "../../../lib/hooks/usePodiumState";
import PodiumPlinth from "./PodiumPlinth";
import { getRankLabel } from "./rankStyles";

export type { UsePodiumStateReturn };

type PodiumPickerState = UsePodiumStateReturn & {
  value: Map<PodiumRank, string | null>;
  onChange: (next: Map<PodiumRank, string | null>) => void;
  rules: PodiumRules;
  playerCount: 2 | 3 | 4;
};

type PodiumPickerProps = {
  state: PodiumPickerState;
  players: PodiumPlayer[];
};

type MenuState = {
  anchorEl: HTMLElement;
  rank: PodiumRank;
  userId: string;
} | null;

export default function PodiumPicker({ state, players }: PodiumPickerProps) {
  const { activeRank, assign, unassign, setActiveRank, value, onChange, rules, playerCount } = state;
  const [menuState, setMenuState] = useState<MenuState>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveRegionId = useId();

  const playersById = useMemo(() => {
    const m = new Map<string, PodiumPlayer>();
    for (const p of players) m.set(p.userId, p);
    return m;
  }, [players]);

  const getAssigned = (rank: PodiumRank): PodiumPlayer | undefined => {
    const userId = value.get(rank);
    return userId ? playersById.get(userId) : undefined;
  };

  let nonWinnerFilled = 0;
  const placedUserIds = new Set<string>();
  for (let r = 1; r <= playerCount; r++) {
    const v = value.get(r as PodiumRank);
    if (v) {
      placedUserIds.add(v);
      if (r > 1) nonWinnerFilled++;
    }
  }
  const isWinnerOnlyMode =
    rules.allowWinnerOnly && !rules.requireFullPodium && !!value.get(1) && nonWinnerFilled === 0;

  useEffect(() => () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const activateWinnerOnly = () => {
    const next = new Map(value);
    for (let r = 2; r <= 4; r++) {
      next.set(r as PodiumRank, null);
    }
    onChange(next);
    setActiveRank(null);
  };

  const openMenu = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>, rank: PodiumRank) => {
    const userId = value.get(rank);
    if (!userId) return;
    setMenuState({ anchorEl: e.currentTarget as HTMLElement, rank, userId });
  };

  const closeMenu = () => setMenuState(null);

  const handlePlinthLongPressStart = (rank: PodiumRank) => (e: React.MouseEvent<HTMLElement>) => {
    if (!value.get(rank)) return;
    longPressTimer.current = setTimeout(() => {
      openMenu(e, rank);
    }, 500);
  };

  const handlePlinthLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePlinthKeyDown = (rank: PodiumRank) => (e: React.KeyboardEvent<HTMLElement>) => {
    if ((e.key === "Enter" || e.key === " ") && value.get(rank)) {
      e.preventDefault();
      openMenu(e, rank);
    }
  };

  const moveToRank = (targetRank: PodiumRank) => {
    if (!menuState) return;
    const userId = menuState.userId;
    const sourceRank = menuState.rank;
    closeMenu();

    const next = new Map(value);
    // Remove userId from source rank
    next.set(sourceRank, null);
    // Place at target rank (displaces any existing occupant back to roster)
    next.set(targetRank, userId);
    onChange(next);
    setActiveRank(sourceRank);
  };

  const activeRankLabel =
    activeRank !== null
      ? `${getRankLabel(activeRank)} place — tap a player`
      : "All placements filled";

  return (
    <Box data-testid="podium-picker">
      <Box
        id={liveRegionId}
        aria-live="polite"
        aria-atomic="true"
        sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
      >
        {activeRankLabel}
      </Box>

      <Stack spacing={1} mb={2}>
        {Array.from({ length: playerCount }, (_, i) => {
          const rank = (i + 1) as PodiumRank;
          const assigned = getAssigned(rank);
          const isDisabled = isWinnerOnlyMode && rank > 1;
          return (
            <Box
              key={rank}
              onMouseDown={assigned ? handlePlinthLongPressStart(rank) : undefined}
              onMouseUp={handlePlinthLongPressEnd}
              onMouseLeave={handlePlinthLongPressEnd}
              onKeyDown={assigned ? handlePlinthKeyDown(rank) : undefined}
            >
              <PodiumPlinth
                rank={rank}
                assigned={assigned}
                isActive={activeRank === rank}
                disabled={isDisabled}
                onActivate={() => {
                  setActiveRank(rank);
                }}
                onClear={() => unassign(rank)}
              />
            </Box>
          );
        })}
      </Stack>

      <Box mb={1}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: "block" }}>
          Roster
        </Typography>
        <Box
          role="listbox"
          aria-label="Available players roster"
          sx={{ display: "flex", flexWrap: "wrap", gap: 1, minHeight: 48 }}
        >
          {players.map((player) => {
            const isPlaced = placedUserIds.has(player.userId);
            return (
              <Chip
                key={player.userId}
                data-testid={`player-chip-${player.userId}`}
                role="option"
                aria-selected={isPlaced}
                label={`${player.displayName}${player.isGuest ? " (guest)" : ""}`}
                onClick={() => {
                  if (!isPlaced) {
                    assign(player.userId);
                    return;
                  }
                  for (let r = 1; r <= playerCount; r++) {
                    if (value.get(r as PodiumRank) === player.userId) {
                      unassign(r as PodiumRank);
                      break;
                    }
                  }
                }}
                variant={isPlaced ? "filled" : "outlined"}
                color={isPlaced ? "primary" : "default"}
                sx={{ minHeight: 48, cursor: "pointer" }}
                tabIndex={0}
              />
            );
          })}
          {players.length === 0 && (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No players available
            </Typography>
          )}
        </Box>
      </Box>

      {rules.allowWinnerOnly && (
        <Button
          data-testid="podium-winner-only-toggle"
          variant="outlined"
          size="small"
          color="inherit"
          onClick={activateWinnerOnly}
          sx={{ mt: 1 }}
        >
          Just pick winner
        </Button>
      )}

      <Menu
        open={!!menuState}
        anchorEl={menuState?.anchorEl}
        onClose={closeMenu}
        aria-label="Placement options"
      >
        {menuState &&
          Array.from({ length: playerCount }, (_, i) => {
            const targetRank = (i + 1) as PodiumRank;
            if (targetRank === menuState.rank) return null;
            return (
              <MenuItem key={targetRank} onClick={() => moveToRank(targetRank)}>
                Move to {getRankLabel(targetRank)}
              </MenuItem>
            );
          })}
        <MenuItem
          onClick={() => {
            if (menuState) unassign(menuState.rank);
            closeMenu();
          }}
        >
          Unrank
        </MenuItem>
      </Menu>
    </Box>
  );
}
