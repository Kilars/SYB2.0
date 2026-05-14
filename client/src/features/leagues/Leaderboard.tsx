import { AutoAwesome, Cancel, CheckCircle, Edit, EmojiEvents, HelpOutline } from "@mui/icons-material";
import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import EmptyState from "../../app/shared/components/EmptyState";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import { getRankStyleSafe } from "../../app/shared/components/rankStyles";
import UserChip from "../../app/shared/components/UserChip";
import { SMASH_COLORS } from "../../app/theme";
import { useAccount } from "../../lib/hooks/useAccount";
import { useLeagues } from "../../lib/hooks/useLeagues";
import MergeGuestDialog from "./MergeGuestDialog";
import StatusButton from "./StatusButton";


type LeaderboardCardProps = {
  rank: number;
  entry: LeaderboardUser;
};

function LeaderboardCard({ rank, entry }: LeaderboardCardProps) {
  const navigate = useNavigate();
  const winRate =
    entry.wins + entry.losses === 0
      ? 0
      : Math.round((entry.wins * 100) / (entry.wins + entry.losses));
  const rankStyle = getRankStyleSafe(rank);
  return (
    <Paper
      elevation={rankStyle ? 4 : 2}
      onClick={() => entry.userId && navigate(`/user/${entry.userId}`)}
      role={entry.userId ? "link" : undefined}
      tabIndex={entry.userId ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" && entry.userId) navigate(`/user/${entry.userId}`);
      }}
      sx={{
        p: 2,
        cursor: entry.userId ? "pointer" : "default",
        backgroundImage: rankStyle?.bg,
        backgroundColor: rankStyle ? undefined : rank % 2 === 0 ? "action.hover" : "background.paper",
        border: rankStyle ? `2px solid ${rankStyle.border}` : "none",
        "&:hover": { filter: "brightness(0.95)" },
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: rankStyle
              ? `linear-gradient(135deg, ${rankStyle.border}, ${rankStyle.color})`
              : `linear-gradient(135deg, ${SMASH_COLORS.p2Blue}, #0f3460)`,
            border: `2px solid ${rankStyle?.border || "#1E88E5"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: rankStyle ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
          }}
        >
          <Typography variant="body1" fontWeight="bold" lineHeight={1} color="white">
            {rank}
          </Typography>
        </Box>
        <Box flex={1} minWidth={0}>
          <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ color: rankStyle?.color }}>
            {entry.displayName}
            {entry.isGuest ? " (guest)" : ""}
          </Typography>
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
            <Typography variant="caption" sx={{ color: rankStyle?.color || "success.main", fontWeight: 600 }}>
              {entry.wins}W
            </Typography>
            <Typography variant="caption" sx={{ color: rankStyle?.color || "error.main", fontWeight: 600 }}>
              {entry.losses}L
            </Typography>
            {entry.flawless > 0 && (
              <Typography variant="caption" sx={{ color: rankStyle?.color || "info.main", fontWeight: 600 }}>
                {entry.flawless}<AutoAwesome sx={{ fontSize: 10, ml: 0.25, verticalAlign: "middle" }} />
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: rankStyle?.color || "text.secondary" }}>
              {winRate}%
            </Typography>
          </Box>
        </Box>
        <Box textAlign="right" flexShrink={0}>
          <Box display="flex" alignItems="center" gap={0.5} justifyContent="flex-end">
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ color: rankStyle ? rankStyle.color : "primary.main" }}
            >
              {entry.points}
            </Typography>
            {entry.flawless > 0 && <AutoAwesome sx={{ color: SMASH_COLORS.gold, fontSize: 18 }} />}
          </Box>
          <Tooltip title="4 pts per win + 1 bonus for 2-0 sweep" enterDelay={200} arrow>
            <Typography variant="caption" color="text.secondary" sx={{ cursor: "help", borderBottom: "1px dotted", borderColor: "text.secondary" }}>
              pts{entry.flawless > 0 ? ` (${entry.flawless} flawless)` : ""}
            </Typography>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const rankStyle = getRankStyleSafe(rank);
  if (!rankStyle) {
    return (
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${SMASH_COLORS.p2Blue}, #0f3460)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2" fontWeight="bold" color="white">
          {rank}
        </Typography>
      </Box>
    );
  }
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: rankStyle.bg,
        border: `2px solid ${rankStyle.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      }}
    >
      <Typography variant="body2" fontWeight="bold" sx={{ color: rankStyle.color }}>
        {rank}
      </Typography>
    </Box>
  );
}

export default function Leaderboard() {
  const { competitionId } = useParams();
  const { league, isLeagueLoading, leaderboard, isLeaderboardLoading } = useLeagues(competitionId);
  const { currentUser } = useAccount();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mergeGuest, setMergeGuest] = useState<{ userId: string; displayName: string } | null>(
    null,
  );
  const isAdmin =
    currentUser &&
    league?.members
      .filter((m) => m.isAdmin)
      .map((x) => x.userId)
      .includes(currentUser.id);
  if (isLeagueLoading || isLeaderboardLoading) return <LoadingSkeleton variant="table" count={5} />;
  else if (!league || !leaderboard)
    return (
      <EmptyState icon={<EmojiEvents sx={{ fontSize: 48 }} />} message="No leaderboard data yet" />
    );
  return (
    <Box>
      {isMobile ? (
        <Stack spacing={1} mb={2}>
          {leaderboard.map((entry, i) => (
            <LeaderboardCard key={entry.displayName} rank={i + 1} entry={entry} />
          ))}
        </Stack>
      ) : (
        <TableContainer
          sx={{
            height: "50vh",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Table stickyHeader aria-label="League leaderboard">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ backgroundColor: "primary.main", color: "white", fontWeight: "bold" }}
                >
                  {" "}
                  #{" "}
                </TableCell>
                <TableCell
                  sx={{ backgroundColor: "primary.main", color: "white", fontWeight: "bold" }}
                >
                  {" "}
                  Player{" "}
                </TableCell>
                <TableCell
                  sx={{ backgroundColor: "primary.main", color: "white", fontWeight: "bold" }}
                  align="center"
                  aria-label="Points"
                >
                  <Tooltip title="4 pts per win + 1 bonus for 2-0 sweep" arrow>
                    <Box display="inline-flex" alignItems="center" gap={0.5} sx={{ cursor: "help" }}>
                      Points
                      <HelpOutline sx={{ fontSize: 16, opacity: 0.8 }} />
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell
                  sx={{ backgroundColor: "primary.main", color: "white", fontWeight: "bold" }}
                  align="center"
                >
                  {" "}
                  WR{" "}
                </TableCell>
                <TableCell
                  sx={{ backgroundColor: "primary.main", color: "white", fontWeight: "bold" }}
                  align="center"
                >
                  {" "}
                  Wins{" "}
                </TableCell>
                <TableCell
                  sx={{ backgroundColor: "primary.main", color: "white", fontWeight: "bold" }}
                  align="center"
                >
                  {" "}
                  Losses{" "}
                </TableCell>
                <TableCell
                  sx={{ backgroundColor: "primary.main", color: "white", fontWeight: "bold" }}
                  align="center"
                  aria-label="Flawless"
                >
                  <Tooltip title="Flawless = 2-0 match victory" arrow>
                    <Box display="inline-flex" alignItems="center" gap={0.5} sx={{ cursor: "help" }}>
                      Flawless
                      <HelpOutline sx={{ fontSize: 16, opacity: 0.8 }} />
                    </Box>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {leaderboard.map((leaderboardUser, i) => {
                const rank = i + 1;
                const rankStyle = getRankStyleSafe(rank);
                const rowBg = rankStyle ? rankStyle.bg : undefined;
                return (
                  <TableRow
                    key={leaderboardUser.displayName}
                    onClick={() =>
                      leaderboardUser.userId &&
                      navigate(`/user/${leaderboardUser.userId}`)
                    }
                    sx={{
                      cursor: leaderboardUser.userId ? "pointer" : "default",
                      backgroundImage: rankStyle ? rowBg : "none",
                      backgroundColor: rankStyle
                        ? undefined
                        : i % 2 === 0
                          ? "action.hover"
                          : "background.paper",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      "&:hover": { filter: "brightness(0.95)" },
                      ...(rankStyle && {
                        borderLeft: `4px solid ${rankStyle.border}`,
                      }),
                    }}
                    tabIndex={leaderboardUser.userId ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && leaderboardUser.userId)
                        navigate(`/user/${leaderboardUser.userId}`);
                    }}
                  >
                    <TableCell sx={{ width: 50, color: rankStyle?.color }}>
                      <RankBadge rank={rank} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: rankStyle ? "bold" : "normal", color: rankStyle?.color }}>
                      <Tooltip
                        title={`${leaderboardUser.displayName} — W: ${leaderboardUser.wins}, L: ${leaderboardUser.losses}, Pts: ${leaderboardUser.points}`}
                        enterDelay={300}
                      >
                        <span>
                          {leaderboardUser.displayName}
                          {leaderboardUser.isGuest ? " (guest)" : ""}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: "bold", fontSize: rankStyle ? "1.1rem" : "inherit", color: rankStyle?.color }}
                    >
                      {leaderboardUser.points}
                    </TableCell>
                    <TableCell align="center" sx={{ color: rankStyle?.color }}>
                      {leaderboardUser.wins + leaderboardUser.losses === 0
                        ? 0
                        : Math.round(
                            (leaderboardUser.wins * 100) /
                              (leaderboardUser.wins + leaderboardUser.losses),
                          ) + "%"}
                    </TableCell>
                    <TableCell align="center" sx={{ color: rankStyle?.color || "success.main", fontWeight: 600 }}>
                      <Box display="inline-flex" alignItems="center" gap={0.5}>
                        {leaderboardUser.wins}
                        {leaderboardUser.wins > 0 && <CheckCircle sx={{ fontSize: 14, opacity: 0.7 }} />}
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ color: rankStyle?.color || "error.main", fontWeight: 600 }}>
                      <Box display="inline-flex" alignItems="center" gap={0.5}>
                        {leaderboardUser.losses}
                        {leaderboardUser.losses > 0 && <Cancel sx={{ fontSize: 14, opacity: 0.7 }} />}
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ color: rankStyle?.color || "info.main", fontWeight: 600 }}>
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        {leaderboardUser.flawless}
                        {leaderboardUser.flawless > 0 && (
                          <AutoAwesome sx={{ color: SMASH_COLORS.gold, fontSize: 16 }} />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Members
      </Typography>

      <Box
        gap={1}
        sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr", md: "1fr 1fr 1fr 1fr" } }}
      >
        {league.members.map((member) => (
          <UserChip
            key={member.userId}
            userId={member.userId}
            displayName={member.displayName}
            isGuest={member.isGuest}
            onMerge={
              isAdmin && member.isGuest
                ? () => setMergeGuest({ userId: member.userId, displayName: member.displayName })
                : undefined
            }
          />
        ))}
      </Box>
      <Box display="flex" width="100%" justifyContent="flex-end" pt={2}>
        {currentUser &&
          league.members
            .filter((m) => m.isAdmin)
            .map((x) => x.userId)
            .includes(currentUser.id) && (
            <>
              {league.status === 0 && (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate(`/manage/${league.id}`)}
                >
                  <Edit />
                  <Typography variant="button" ml={1}>
                    Edit league
                  </Typography>
                </Button>
              )}
              <StatusButton competitionId={league.id} leagueStatus={league.status} />
            </>
          )}
      </Box>
      {mergeGuest && (
        <MergeGuestDialog
          guestUserId={mergeGuest.userId}
          guestDisplayName={mergeGuest.displayName}
          open={!!mergeGuest}
          onClose={() => setMergeGuest(null)}
        />
      )}
    </Box>
  );
}
