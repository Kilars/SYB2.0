import { Avatar, Box, Typography } from "@mui/material";

import type { PodiumPlayer, PodiumRank } from "../../../lib/hooks/usePodiumState";
import { getRankLabel, getRankStyle } from "./rankStyles";

type PodiumPlinthProps = {
  rank: PodiumRank;
  assigned?: PodiumPlayer;
  isActive: boolean;
  disabled?: boolean;
  onActivate: () => void;
  onClear: () => void;
};

const PLINTH_HEIGHTS: Record<PodiumRank, number> = {
  1: 96,
  2: 80,
  3: 72,
  4: 64,
};

export default function PodiumPlinth({
  rank,
  assigned,
  isActive,
  disabled,
  onActivate,
  onClear,
}: PodiumPlinthProps) {
  const rankStyle = getRankStyle(rank);
  const minHeight = PLINTH_HEIGHTS[rank];
  const rankLabel = getRankLabel(rank);
  const ariaLabel = assigned
    ? `${rankStyle.medalEmoji} ${rankLabel} place: ${assigned.displayName} — click to unplace`
    : `${rankLabel} place — tap a player to place here`;

  const handleClick = () => {
    if (disabled) return;
    if (assigned) {
      onClear();
    } else {
      onActivate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Box
      data-testid={`podium-plinth-${rank}`}
      role="button"
      aria-label={ariaLabel}
      aria-pressed={isActive}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      sx={{
        minHeight: Math.max(minHeight, 48),
        minWidth: 48,
        borderRadius: 2,
        border: isActive
          ? `2px solid ${rankStyle.border}`
          : disabled
            ? "2px solid transparent"
            : `2px dashed ${rankStyle.border}`,
        backgroundImage: assigned ? rankStyle.bg : undefined,
        backgroundColor: assigned ? undefined : disabled ? "action.disabledBackground" : "action.hover",
        display: "flex",
        alignItems: "center",
        px: 2,
        py: 1,
        gap: 1.5,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s ease",
        outline: "none",
        boxShadow: isActive && !assigned ? `0 0 0 2px ${rankStyle.border}40` : undefined,
        animation: isActive && !assigned ? "podiumPulse 1.5s ease-in-out infinite" : undefined,
        "&:focus-visible": {
          outline: `2px solid ${rankStyle.border}`,
          outlineOffset: 2,
        },
        "@keyframes podiumPulse": {
          "0%, 100%": { boxShadow: `0 0 0 2px ${rankStyle.border}40` },
          "50%": { boxShadow: `0 0 0 6px ${rankStyle.border}60` },
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontSize: "1.4rem", lineHeight: 1, flexShrink: 0 }}
        aria-hidden="true"
      >
        {rankStyle.medalEmoji}
      </Typography>
      {assigned ? (
        <>
          <Avatar
            src={assigned.imageUrl}
            alt={assigned.displayName}
            sx={{ width: 36, height: 36, flexShrink: 0 }}
          >
            {assigned.displayName[0]}
          </Avatar>
          <Box minWidth={0}>
            <Typography
              variant="body1"
              fontWeight="bold"
              noWrap
              sx={{ color: rankStyle.color }}
            >
              {assigned.displayName}
              {assigned.isGuest ? " (guest)" : ""}
            </Typography>
          </Box>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          {isActive ? "tap a player…" : "empty"}
        </Typography>
      )}
    </Box>
  );
}
