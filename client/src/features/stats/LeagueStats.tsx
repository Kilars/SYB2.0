import { useParams } from "react-router";
import { useLeagues } from "../../lib/hooks/useLeagues"
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { useCharacters } from "../../lib/hooks/useCharacters";

export default function LeagueStats() {
  const { leagueId } = useParams();
  const { league, isLeagueLoading } = useLeagues(leagueId);
  const { characters } = useCharacters();

  if (isLeagueLoading) return <div>Loading...</div>
  if (!league || !characters) return <div>No league stats</div>

  const computeCharacterWinratesPercentage = (matches: Match[]): (string | number)[][] => {
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
    const charDict = Object.entries(winsDict).map(([charId, [wins, total]]) => {
      const charName = characters.find(c => c.id === charId)?.shorthandName || "Unknown";
      const winrate = Math.round((wins / total) * 100);
      return [charName, winrate, total];
    })
    return charDict;
  }
  const charStats = computeCharacterWinratesPercentage(league.matches);

  return (
    <Box>
      <TableContainer sx={{ height: '40vh' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ textAlign: 'left', backgroundColor: '#C0DEFA' }}> Character </TableCell>
              <TableCell sx={{ textAlign: 'right', backgroundColor: '#C0DEFA'}}> WR </TableCell>
              <TableCell sx={{ textAlign: 'right', backgroundColor: '#C0DEFA' }}> Rounds </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {charStats
              .sort((a, b) => Number(b[1]) - Number(a[1]))
              .filter(a => Number(a[2]) >= 3)
              .map((stats, i) => (
                <TableRow key={stats[0]} sx={{ backgroundColor: i % 2 == 0 ? '#E5EFF9' : '#D6E6F6' }}>
                  <TableCell> {stats[0]}</TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 40,
                      textAlign: 'right',
                      paddingRight: 2,
                      letterSpacing: '0.05em'
                    }}
                  >
                    {stats[1]}%
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 40,
                      textAlign: 'right',
                      paddingRight: 2,
                      letterSpacing: '0.05em'
                    }}
                  >
                    {stats[2]}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
