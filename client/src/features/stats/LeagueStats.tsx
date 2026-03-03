import { BarChart as BarChartIcon } from "@mui/icons-material";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useParams } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import EmptyState from "../../app/shared/components/EmptyState";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import { SMASH_COLORS } from "../../app/theme";
import { useCharacters } from "../../lib/hooks/useCharacters";
import { useLeagues } from "../../lib/hooks/useLeagues";

const CHART_COLORS = [
  SMASH_COLORS.p1Red,
  SMASH_COLORS.p2Blue,
  SMASH_COLORS.p3Yellow,
  SMASH_COLORS.p4Green,
  "#AB47BC",
  "#FF7043",
  "#26C6DA",
  "#8D6E63",
  "#EC407A",
  "#66BB6A",
  "#FFA726",
  "#5C6BC0",
  "#78909C",
  "#D4E157",
  "#29B6F6",
  "#EF5350",
];

export default function LeagueStats() {
  const { competitionId } = useParams();
  const { league, isLeagueLoading, leaderboard, isLeaderboardLoading } = useLeagues(competitionId);
  const { characters } = useCharacters();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (isLeagueLoading || isLeaderboardLoading) return <LoadingSkeleton variant="chart" count={5} />;
  if (!league || !characters)
    return (
      <EmptyState icon={<BarChartIcon sx={{ fontSize: 48 }} />} message="No league stats yet" />
    );

  // Character win rate computation
  const computeCharacterWinratesPercentage = (
    matches: Match[],
  ): { name: string; winRate: number; total: number; imageUrl: string }[] => {
    const winsDict: Record<string, [wins: number, total: number]> = {};
    matches
      .flatMap((m) => m.rounds)
      .filter((round) => round.completed)
      .forEach((round) => {
        const char1 = round.playerOneCharacterId;
        const char2 = round.playerTwoCharacterId;
        if (!char1 || !char2) return;
        if (!winsDict[char1]) winsDict[char1] = [0, 0];
        if (!winsDict[char2]) winsDict[char2] = [0, 0];
        winsDict[char1][1] += 1;
        winsDict[char2][1] += 1;

        const p1 = matches.find((m) =>
          m.rounds.some(
            (r) =>
              r.matchNumber === round.matchNumber &&
              r.bracketNumber === round.bracketNumber &&
              r.roundNumber === round.roundNumber,
          ),
        )?.playerOne?.userId;
        if (p1 === round.winnerUserId) winsDict[char1][0] += 1;
        else winsDict[char2][0] += 1;
      });
    return Object.entries(winsDict).map(([charId, [wins, total]]) => {
      const char = characters.find((c) => c.id === charId);
      return {
        name: char?.shorthandName || "Unknown",
        winRate: Math.round((wins / total) * 100),
        total,
        imageUrl: char?.imageUrl || "",
      };
    });
  };

  const charStats = computeCharacterWinratesPercentage(league.matches);

  // Player win rate data for bar chart
  const playerWinRates = leaderboard
    ? leaderboard.map((player, i) => ({
        name: player.displayName,
        winRate:
          player.wins + player.losses === 0
            ? 0
            : Math.round((player.wins * 100) / (player.wins + player.losses)),
        wins: player.wins,
        losses: player.losses,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }))
    : [];

  const hasCharData = charStats.length > 0;
  const hasPlayerData = playerWinRates.length > 0;

  // Scatter chart data — index for X, win rate for Y
  const scatterData = charStats
    .sort((a, b) => b.total - a.total)
    .map((s) => ({
      x: s.total,
      winRate: s.winRate,
      total: s.total,
      name: s.name,
      imageUrl: s.imageUrl,
    }));

  const CharacterDot = (props: {
    cx?: number;
    cy?: number;
    payload?: (typeof scatterData)[number];
  }) => {
    const { cx = 0, cy = 0, payload } = props;
    if (!payload?.imageUrl) return null;
    const size = 36;
    return (
      <g>
        <defs>
          <clipPath id={`clip-${payload.name}`}>
            <circle cx={cx} cy={cy} r={size / 2} />
          </clipPath>
        </defs>
        <circle cx={cx} cy={cy} r={size / 2 + 2} fill={theme.palette.divider} />
        <image
          href={payload.imageUrl}
          x={cx - size / 2}
          y={cy - size / 2}
          width={size}
          height={size}
          clipPath={`url(#clip-${payload.name})`}
        />
      </g>
    );
  };

  return (
    <Box>
      {/* Character Win Rate Scatter Chart */}
      {hasCharData && (
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: "primary.main" }}>
            Character Win Rates
          </Typography>
          <Box sx={{ width: "100%", height: isMobile ? 350 : 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[0, Math.max(...scatterData.map((d) => d.total)) + 1]}
                  textAnchor="middle"
                  height={60}
                  tick={{ fontSize: 11 }}
                  label={{ value: "Rounds Played", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  type="number"
                  dataKey="winRate"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  label={{
                    value: "Win Rate",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12 },
                  }}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const data = payload[0]?.payload as (typeof scatterData)[number];
                    return (
                      <Box
                        sx={{
                          bgcolor: "background.paper",
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          p: 1.5,
                          boxShadow: 2,
                        }}
                      >
                        <Typography variant="body2" fontWeight="bold">
                          {data.name}
                        </Typography>
                        <Typography variant="caption">Win Rate: {data.winRate}%</Typography>
                        <br />
                        <Typography variant="caption">Rounds: {data.total}</Typography>
                      </Box>
                    );
                  }}
                />
                <Scatter data={scatterData} shape={<CharacterDot />} />
              </ScatterChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Player Win Rate Bar Chart */}
      {hasPlayerData && (
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: "primary.main" }}>
            Player Win Rates
          </Typography>
          <Box sx={{ width: "100%", height: Math.max(200, playerWinRates.length * 50) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={playerWinRates}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Win Rate"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #ddd" }}
                />
                <Legend />
                <Bar dataKey="winRate" name="Win Rate %" radius={[0, 6, 6, 0]}>
                  {playerWinRates.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Character Win Rates Table */}
      <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: "primary.main" }}>
        Character Win Rate Details
      </Typography>
      <TableContainer sx={{ maxHeight: "40vh", overflowX: "auto" }}>
        <Table stickyHeader aria-label="Character win rates table">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ backgroundColor: "primary.main", color: "white", fontWeight: "bold" }}
              >
                {" "}
                Character{" "}
              </TableCell>
              <TableCell
                sx={{ backgroundColor: "primary.main", color: "white", fontWeight: "bold" }}
                align="right"
              >
                {" "}
                WR{" "}
              </TableCell>
              <TableCell
                sx={{ backgroundColor: "primary.main", color: "white", fontWeight: "bold" }}
                align="right"
              >
                {" "}
                Rounds{" "}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {charStats
              .sort((a, b) => b.winRate - a.winRate)
              .filter((a) => a.total >= 3)
              .map((stats, i) => (
                <TableRow
                  key={stats.name}
                  sx={{
                    backgroundColor: i % 2 === 0 ? "action.hover" : "background.paper",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {stats.imageUrl && (
                        <img
                          src={stats.imageUrl}
                          alt={stats.name}
                          style={{ width: 28, height: 28, borderRadius: 4 }}
                        />
                      )}
                      {stats.name}
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 40,
                      textAlign: "right",
                      paddingRight: 2,
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                      color:
                        stats.winRate >= 60
                          ? "success.main"
                          : stats.winRate <= 40
                            ? "error.main"
                            : "text.primary",
                    }}
                  >
                    {stats.winRate}%
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 40,
                      textAlign: "right",
                      paddingRight: 2,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {stats.total}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
