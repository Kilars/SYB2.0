import { Box, Card, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useNavigate, useParams } from "react-router";
import { useCharacters } from "../../lib/hooks/useCharacters";
import { SportsEsports, CheckCircle, Cancel } from "@mui/icons-material";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";

export default function MatchesList() {
  const { leagueId } = useParams();
  const { league, isLeagueLoading } = useLeagues(leagueId);
  const { characters } = useCharacters();
  const navigate = useNavigate();
  if (isLeagueLoading) return <LoadingSkeleton variant="card" count={3} />
  if (!league || !characters) return (
    <EmptyState
      icon={<SportsEsports sx={{ fontSize: 48 }} />}
      message="No matches in this split"
    />
  )
  return (
    <Box>
      {league.matches.length === 0
        ? <EmptyState
            icon={<SportsEsports sx={{ fontSize: 48 }} />}
            message="No matches in this split"
          />
        :
        <Box display='flex' flexDirection='column' gap={2}>
          {league.matches.map(match => {
            const p1Wins = match.rounds.filter(r => r.winnerUserId === match.playerOne.userId).length;
            const p2Wins = match.rounds.filter(r => r.winnerUserId === match.playerTwo.userId).length;
            const winnerPlayer = match.winnerUserId === match.playerOne.userId
              ? match.playerOne
              : match.playerTwo;
            const winner = winnerPlayer.displayName + (winnerPlayer.isGuest ? ' (guest)' : '');

            return (
              <Box
                key={match.leagueId + match.split + match.matchNumber}
                component={Card}
                elevation={match.completed ? 1 : 3}
                p={2}
                onClick={() => navigate(`/leagues/${match.leagueId}/split/${match.split}/match/${match.matchNumber}`)}
                sx={{
                  cursor: 'pointer',
                  borderLeft: match.completed ? '4px solid' : '4px solid transparent',
              borderLeftColor: match.completed ? 'success.main' : 'transparent',
                  opacity: match.completed ? 0.85 : 1,
                }}
              >
              <Box>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                  <Typography variant="h4" fontFamily="monospace" fontStyle="italic" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>{match.playerOne.displayName}{match.playerOne.isGuest ? ' (guest)' : ''}</Typography>
                  {match.completed
                    ? <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircle fontSize="small" />
                        {p1Wins} — {p2Wins}
                      </Typography>
                    : <Typography variant="body2" color="text.secondary">vs</Typography>
                  }
                  <Typography variant="h4" fontFamily="monospace" fontStyle="italic" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>{match.playerTwo.displayName}{match.playerTwo.isGuest ? ' (guest)' : ''}</Typography>
                </Box>
                <Box display='flex' flexDirection='row' justifyContent='space-between'>
                  <Box display='flex'>
                    {match.rounds.map(round => {
                      if (!round.playerOneCharacterId) return null;
                      const isWin = round.winnerUserId === match.playerOne.userId;
                      const character = characters.find(c => c.id === round.playerOneCharacterId);
                      return (
                        <Box key={round.leagueId + round.split + round.matchNumber + round.roundNumber} sx={{ border: '2px solid', m: 1, borderColor: isWin ? 'success.main' : 'error.main', display: 'flex', alignItems: 'center', position: 'relative' }}>
                          <img
                            alt={character?.fullName ?? ''}
                            style={{ width: 'clamp(35px, 8vw, 50px)', height: 'clamp(35px, 8vw, 50px)' }}
                            src={character?.imageUrl}
                          />
                          <Box sx={{ position: 'absolute', bottom: 0, right: 0 }}>
                            {isWin ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                  <Box display='flex'>
                    {match.rounds.map(round => {
                      if (!round.playerTwoCharacterId) return null;
                      const isWin = round.winnerUserId === match.playerTwo.userId;
                      const character = characters.find(c => c.id === round.playerTwoCharacterId);
                      return (
                        <Box key={round.leagueId + round.split + round.matchNumber + round.roundNumber} sx={{ border: '2px solid', m: 1, borderColor: isWin ? 'success.main' : 'error.main', display: 'flex', alignItems: 'center', position: 'relative' }}>
                          <img
                            alt={character?.fullName ?? ''}
                            style={{ width: 'clamp(35px, 8vw, 50px)', height: 'clamp(35px, 8vw, 50px)' }}
                            src={character?.imageUrl}
                          />
                          <Box sx={{ position: 'absolute', bottom: 0, right: 0 }}>
                            {isWin ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                  <Typography> Match #{match.matchNumber} </Typography>
                  <Typography> Split {match.split} </Typography>
                </Box>
                <Box>
                  {match.completed
                    ? <Typography variant="body2" color="text.secondary">Winner: {winner}</Typography>
                    : <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>Register result</Typography>
                  }
                </Box>
              </Box>
            </Box>
            );
          })}
        </Box>
      }
    </Box>
  )
}
