import { useParams } from "react-router";
import { useLeagues } from "../../lib/hooks/useLeagues"
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useCharacters } from "../../lib/hooks/useCharacters";
import { BarChart as BarChartIcon } from "@mui/icons-material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";
import { SMASH_COLORS } from "../../app/theme";

const PIE_COLORS = [
  SMASH_COLORS.p1Red, SMASH_COLORS.p2Blue, SMASH_COLORS.p3Yellow, SMASH_COLORS.p4Green,
  '#AB47BC', '#FF7043', '#26C6DA', '#8D6E63',
  '#EC407A', '#66BB6A', '#FFA726', '#5C6BC0',
  '#78909C', '#D4E157', '#29B6F6', '#EF5350',
];

export default function LeagueStats() {
  const { leagueId } = useParams();
  const { league, isLeagueLoading, leaderboard, isLeaderboardLoading } = useLeagues(leagueId);
  const { characters } = useCharacters();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isLeagueLoading || isLeaderboardLoading) return <LoadingSkeleton variant="table" count={5} />
  if (!league || !characters) return (
    <EmptyState
      icon={<BarChartIcon sx={{ fontSize: 48 }} />}
      message="No league stats yet"
    />
  )

  // Character win rate computation
  const computeCharacterWinratesPercentage = (matches: Match[]): { name: string; winRate: number; total: number; imageUrl: string }[] => {
    const winsDict: { [key: string]: [wins: number, total: number] } = {};
    matches.flatMap(m => m.rounds).filter(round => round.completed).forEach(round => {
      const char1 = round.playerOneCharacterId;
      const char2 = round.playerTwoCharacterId;
      if (!char1 || !char2) return;
      if (!winsDict[char1]) winsDict[char1] = [0, 0];
      if (!winsDict[char2]) winsDict[char2] = [0, 0];
      winsDict[char1][1] += 1;
      winsDict[char2][1] += 1;

      const p1 = matches.find(m => m.rounds.some(r =>
        r.matchNumber === round.matchNumber
        && r.split === round.split
        && r.roundNumber === round.roundNumber))?.playerOne.userId;
      if (p1 === round.winnerUserId) winsDict[char1][0] += 1;
      else winsDict[char2][0] += 1;
    })
    return Object.entries(winsDict).map(([charId, [wins, total]]) => {
      const char = characters.find(c => c.id === charId);
      return {
        name: char?.shorthandName || "Unknown",
        winRate: Math.round((wins / total) * 100),
        total,
        imageUrl: char?.imageUrl || '',
      };
    });
  }

  // Character pick distribution
  const computeCharacterPickCounts = (matches: Match[]): { name: string; picks: number; imageUrl: string }[] => {
    const pickDict: { [key: string]: number } = {};
    matches.flatMap(m => m.rounds).filter(round => round.completed).forEach(round => {
      if (round.playerOneCharacterId) {
        pickDict[round.playerOneCharacterId] = (pickDict[round.playerOneCharacterId] || 0) + 1;
      }
      if (round.playerTwoCharacterId) {
        pickDict[round.playerTwoCharacterId] = (pickDict[round.playerTwoCharacterId] || 0) + 1;
      }
    });
    return Object.entries(pickDict)
      .map(([charId, picks]) => {
        const char = characters.find(c => c.id === charId);
        return { name: char?.shorthandName || "Unknown", picks, imageUrl: char?.imageUrl || '' };
      })
      .sort((a, b) => b.picks - a.picks);
  }

  const charStats = computeCharacterWinratesPercentage(league.matches);
  const charPicks = computeCharacterPickCounts(league.matches);

  // Player win rate data for bar chart
  const playerWinRates = leaderboard
    ? leaderboard.map((player, i) => ({
        name: player.displayName,
        winRate: (player.wins + player.losses) === 0 ? 0 : Math.round((player.wins * 100) / (player.wins + player.losses)),
        wins: player.wins,
        losses: player.losses,
        fill: PIE_COLORS[i % PIE_COLORS.length],
      }))
    : [];

  const hasCharData = charPicks.length > 0;
  const hasPlayerData = playerWinRates.length > 0;

  return (
    <Box>
      {/* Character Pick Distribution Pie Chart */}
      {hasCharData && (
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: 'primary.main' }}>
            Character Pick Distribution
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
            <Box sx={{ width: { xs: '100%', md: '50%' }, height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charPicks}
                    dataKey="picks"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 80 : 110}
                    innerRadius={isMobile ? 30 : 40}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {charPicks.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} picks`]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #ddd' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            {/* Character legend with images */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              {charPicks.slice(0, 12).map((char, i) => (
                <Box
                  key={char.name}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    px: 1, py: 0.5,
                    borderRadius: 2,
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    border: `2px solid ${PIE_COLORS[i % PIE_COLORS.length]}`,
                  }}
                >
                  {char.imageUrl && (
                    <img
                      src={char.imageUrl}
                      alt={char.name}
                      style={{ width: 28, height: 28, borderRadius: 4 }}
                    />
                  )}
                  <Typography variant="caption" fontWeight="bold">
                    {char.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({char.picks})
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* Player Win Rate Bar Chart */}
      {hasPlayerData && (
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: 'primary.main' }}>
            Player Win Rates
          </Typography>
          <Box sx={{ width: '100%', height: Math.max(200, playerWinRates.length * 50) }}>
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
                  formatter={(value) => [`${value}%`, 'Win Rate']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #ddd' }}
                />
                <Legend />
                <Bar dataKey="winRate" name="Win Rate %" radius={[0, 6, 6, 0]}>
                  {playerWinRates.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {/* Character Win Rates Table */}
      <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: 'primary.main' }}>
        Character Win Rates
      </Typography>
      <TableContainer sx={{ maxHeight: '40vh', overflowX: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: '#0f3460', color: 'white', fontWeight: 'bold' }}> Character </TableCell>
              <TableCell sx={{ backgroundColor: '#0f3460', color: 'white', fontWeight: 'bold' }} align="right"> WR </TableCell>
              <TableCell sx={{ backgroundColor: '#0f3460', color: 'white', fontWeight: 'bold' }} align="right"> Rounds </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {charStats
              .sort((a, b) => b.winRate - a.winRate)
              .filter(a => a.total >= 3)
              .map((stats, i) => (
                <TableRow key={stats.name} sx={{ backgroundColor: i % 2 === 0 ? '#E8EAF6' : '#E3F2FD', borderBottom: '1px solid #bbb' }}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {stats.imageUrl && (
                        <img src={stats.imageUrl} alt={stats.name} style={{ width: 28, height: 28, borderRadius: 4 }} />
                      )}
                      {stats.name}
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 40,
                      textAlign: 'right',
                      paddingRight: 2,
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                      color: stats.winRate >= 60 ? '#43A047' : stats.winRate <= 40 ? '#E53935' : 'text.primary',
                    }}
                  >
                    {stats.winRate}%
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 40,
                      textAlign: 'right',
                      paddingRight: 2,
                      letterSpacing: '0.05em'
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
  )
}
