import { BarChart as BarChartIcon } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useParams } from "react-router";

import EmptyState from "../../app/shared/components/EmptyState";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import { useCharacters } from "../../lib/hooks/useCharacters";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { computeCharacterWinRates } from "../../lib/util/statUtils";
import {
  CharacterWinRateLogScatter,
  CharacterWinRateLollipop,
  CharacterWinRateTable,
  PlayerWinRateBar,
} from "./charts";

export default function LeagueStats() {
  const { competitionId } = useParams();
  const { league, isLeagueLoading, leaderboard, isLeaderboardLoading } = useLeagues(competitionId);
  const { characters } = useCharacters();

  if (isLeagueLoading || isLeaderboardLoading) return <LoadingSkeleton variant="chart" count={5} />;
  if (!league || !characters)
    return (
      <EmptyState icon={<BarChartIcon sx={{ fontSize: 48 }} />} message="No league stats yet" />
    );

  const charStats = computeCharacterWinRates(league.matches, characters);

  const playerWinRates: PlayerWinRate[] = leaderboard
    ? leaderboard.map((player) => ({
        userId: player.userId || "",
        displayName: player.displayName,
        winRate:
          player.wins + player.losses === 0
            ? 0
            : Math.round((player.wins * 100) / (player.wins + player.losses)),
        wins: player.wins,
        losses: player.losses,
      }))
    : [];

  return (
    <Box>
      {charStats.length > 0 && (
        <>
          <Box mb={4}>
            <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: "primary.main" }}>
              Character Win Rates — Volume vs Win %
            </Typography>
            <CharacterWinRateLogScatter data={charStats} />
          </Box>

          <Box mb={4}>
            <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: "primary.main" }}>
              Character Win Rates — Sorted by Rounds Played
            </Typography>
            <CharacterWinRateLollipop data={charStats} />
          </Box>
        </>
      )}

      {playerWinRates.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: "primary.main" }}>
            Player Win Rates
          </Typography>
          <PlayerWinRateBar data={playerWinRates} />
        </Box>
      )}

      <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: "primary.main" }}>
        Character Win Rate Details
      </Typography>
      <CharacterWinRateTable data={charStats} />
    </Box>
  );
}
