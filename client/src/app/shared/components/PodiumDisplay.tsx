import { Avatar, Box, Chip, Typography } from "@mui/material";

import { getRankLabel, getRankStyle } from "./rankStyles";

type PlacementEntry = {
  userId: string;
  displayName: string;
  imageUrl?: string;
  isGuest?: boolean;
};

type PodiumDisplayProps = {
  placements: {
    winner?: PlacementEntry;
    second?: PlacementEntry;
    third?: PlacementEntry;
    fourth?: PlacementEntry;
  };
  participants: PlacementEntry[];
  collapseRule: "winner-only" | "never";
};

const AVATAR_SIZES: Record<1 | 2 | 3 | 4, number> = { 1: 56, 2: 44, 3: 36, 4: 32 };

function PlacementRow({
  rank,
  entry,
}: {
  rank: 1 | 2 | 3 | 4;
  entry: PlacementEntry;
}) {
  const rankStyle = getRankStyle(rank);
  const avatarSize = AVATAR_SIZES[rank];
  const rankLabel = getRankLabel(rank);

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1.5}
      sx={{
        px: 2,
        py: 1,
        borderRadius: 2,
        backgroundImage: rankStyle.bg,
        border: `2px solid ${rankStyle.border}`,
        opacity: rank === 4 ? 0.85 : 1,
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontSize: "1.2rem", lineHeight: 1, flexShrink: 0 }}
        aria-hidden="true"
      >
        {rankStyle.medalEmoji}
      </Typography>
      <Avatar
        src={entry.imageUrl}
        alt={entry.displayName}
        sx={{ width: avatarSize, height: avatarSize, flexShrink: 0 }}
      >
        {entry.displayName[0]}
      </Avatar>
      <Box minWidth={0}>
        <Typography variant="body1" fontWeight="bold" noWrap sx={{ color: rankStyle.color }}>
          {entry.displayName}
          {entry.isGuest ? " (guest)" : ""}
        </Typography>
        <Typography variant="caption" sx={{ color: rankStyle.color, opacity: 0.8 }}>
          {rankLabel}
        </Typography>
      </Box>
    </Box>
  );
}

export default function PodiumDisplay({ placements, participants, collapseRule }: PodiumDisplayProps) {
  const { winner, second, third, fourth } = placements;

  const placedUserIds = new Set(
    [winner, second, third, fourth]
      .filter((p): p is PlacementEntry => p != null)
      .map((p) => p.userId),
  );

  const unplacedParticipants = participants.filter((p) => !placedUserIds.has(p.userId));

  const showCollapsed =
    collapseRule === "winner-only" && !!winner && !second && !third && !fourth && unplacedParticipants.length > 0;

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {winner && <PlacementRow rank={1} entry={winner} />}
      {second && <PlacementRow rank={2} entry={second} />}
      {third && <PlacementRow rank={3} entry={third} />}
      {fourth && <PlacementRow rank={4} entry={fourth} />}

      {showCollapsed && (
        <Box sx={{ mt: 0.5 }}>
          <Chip
            label={`Other participants: ${unplacedParticipants.map((p) => p.displayName).join(", ")}`}
            size="small"
            variant="outlined"
            sx={{ color: "text.secondary", borderColor: "text.disabled" }}
          />
        </Box>
      )}
    </Box>
  );
}
